const axios = require('axios');
const { spawnSync } = require('child_process');
const supabase = require('./../config/supabaseClient');

class AgriPestScannerService {
  constructor() {
    this.plantIdApiKey = process.env.PLANT_ID_API_KEY;
    const configuredUrl = process.env.PLANT_ID_HEALTH_URL || 'https://api.plant.id/v2/health_assessment';
    this.plantIdUrl = configuredUrl.includes('/identify')
      ? configuredUrl.replace('/identify', '/health_assessment')
      : configuredUrl;
    this.diseaseDetails = [
      'common_names',
      'url',
      'description',
      'classification',
      'cause',
      'treatment',
      'local_name'
    ];
  }

  async persistScan(scanPayload) {
    try {
      await supabase.from('plant_scans').insert(scanPayload);
    } catch (error) {
      // Scan persistence is optional and must never break scanning.
    }
  }

  async prepareImageBuffer(imageBuffer) {
    const pythonScript = `
import io
import sys
from PIL import Image, ImageOps

data = sys.stdin.buffer.read()
img = Image.open(io.BytesIO(data))
img = ImageOps.exif_transpose(img)

if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
    alpha = img.convert("RGBA")
    base = Image.new("RGB", alpha.size, (255, 255, 255))
    base.paste(alpha, mask=alpha.split()[-1])
    img = base
elif img.mode != "RGB":
    img = img.convert("RGB")

img.thumbnail((1500, 1500))

out = io.BytesIO()
img.save(out, format="JPEG", quality=90, optimize=True)
sys.stdout.buffer.write(out.getvalue())
`;

    const pythonCommand = process.env.PYTHON_BIN || 'python';
    const result = spawnSync(pythonCommand, ['-c', pythonScript], {
      input: imageBuffer,
      maxBuffer: 10 * 1024 * 1024
    });

    if (result.status === 0 && result.stdout?.length) {
      return result.stdout;
    }

    console.warn('Image normalization failed, falling back to original buffer', {
      status: result.status,
      stderr: result.stderr?.toString?.() || result.error?.message || ''
    });

    return imageBuffer;
  }

  normalizeResult(raw = {}) {
    const healthAssessment = raw.health_assessment || {};
    const diseases = Array.isArray(healthAssessment.diseases) ? healthAssessment.diseases : [];
    const bestMatch = diseases[0] || {};
    const diseaseDetails = bestMatch.disease_details || bestMatch.details || {};
    const treatment = diseaseDetails.treatment || {};
    const plantName = bestMatch.name || diseaseDetails.local_name || 'Unknown plant';
    const plantProbability = bestMatch.probability || 0;

    return {
      plantName,
      probability: plantProbability,
      isHealthy: healthAssessment.is_healthy ?? diseases.length === 0,
      isHealthyProbability:
        healthAssessment.is_healthy_probability ??
        (diseases.length ? Math.max(0.05, 1 - plantProbability) : plantProbability),
      conditions: [
        {
          name: bestMatch.name || diseaseDetails.local_name || 'No major disease detected',
          probability: bestMatch.probability || 0,
          description: diseaseDetails.description || '',
          treatment: {
            biological: treatment.biological || [],
            chemical: treatment.chemical || [],
            prevention: treatment.prevention || []
          }
        }
      ],
      primaryCondition: {
        name: bestMatch.name || diseaseDetails.local_name || 'No major disease detected',
        treatment:
          treatment.biological?.[0] ||
          treatment.chemical?.[0] ||
          treatment.prevention?.[0] ||
          'Monitor the crop and keep leaves dry and well ventilated.'
      }
    };
  }

  async identifyPest(imageBuffer, imageType = 'image/jpeg', userId = null) {
    console.log('identifyPest invoked', {
      hasBuffer: !!imageBuffer,
      imageType,
      bufferSize: imageBuffer?.length || 0,
      userId,
      apiKeyConfigured: !!this.plantIdApiKey,
      plantIdUrl: this.plantIdUrl
    });

    if (!this.plantIdApiKey) {
      console.log('identifyPest aborted: PLANT_ID_API_KEY is missing');
      return {
        success: false,
        code: 'MISSING_API_KEY',
        message:
          'Plant.id API key is not configured. Set PLANT_ID_API_KEY in backend/.env to enable pest scanning.'
      };
    }

    try {
      const normalizedBuffer = await this.prepareImageBuffer(imageBuffer);
      const imageBase64 = Buffer.from(normalizedBuffer).toString('base64');
      const requestBody = {
        images: [imageBase64],
        disease_details: this.diseaseDetails,
        language: 'en',
        prune_diseases: false,
        modifiers: ['crops_fast', 'similar_images']
      };

      console.log('Plant.id request prepared', {
        imageType,
        bufferSize: imageBuffer?.length || 0,
        normalizedBufferSize: normalizedBuffer?.length || 0,
        endpoint: this.plantIdUrl,
        bodyKeys: Object.keys(requestBody),
        imagePreviewLength: imageBase64.length
      });

      const response = await axios.post(this.plantIdUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': this.plantIdApiKey
        },
        timeout: 15000
      });

      console.log('Plant.id response received', {
        status: response.status,
        keys: Object.keys(response.data || {}),
        statusField: response.data?.status || null
      });

      if (response.data?.status && !['COMPLETED', '', null].includes(response.data.status)) {
        return {
          success: false,
          code: 'SCAN_INCOMPLETE',
          message: `Plant.id identification not completed: status=${response.data.status}`
        };
      }

      const normalized = this.normalizeResult(response.data);
      console.log('Normalized pest scan result', {
        plantName: normalized.plantName,
        probability: normalized.probability,
        isHealthy: normalized.isHealthy,
        conditionCount: normalized.conditions?.length || 0
      });

      if (userId) {
        console.log('Persisting pest scan record', {
          userId,
          plantName: normalized.plantName,
          conditionName: normalized.primaryCondition?.name
        });
        await this.persistScan({
          user_id: userId,
          plant_name: normalized.plantName,
          condition_name: normalized.primaryCondition.name,
          confidence: normalized.conditions[0]?.probability || 0,
          is_healthy: normalized.isHealthy,
          raw_result: response.data
        });
      }

      return {
        success: true,
        identification: normalized
      };
    } catch (error) {
      console.error('identifyPest failed', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      return {
        success: false,
        code: error.response?.status === 401 ? 'INVALID_API_KEY' : 'SCAN_FAILED',
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          (error.response?.status === 400
            ? 'Plant.id rejected the image data. The image may be unsupported or corrupted.'
            : 'Failed to identify pest or disease. Please try again later.'),
        error: error.message
      };
    }
  }

  async getHealthScore(identification) {
    const primaryProbability = identification?.conditions?.[0]?.probability || 0;
    const score = identification?.isHealthy ? 92 : Math.max(15, Math.round((1 - primaryProbability) * 100));

    return {
      score,
      status: score >= 80 ? 'Healthy' : score >= 55 ? 'Needs attention' : 'High risk'
    };
  }
}

module.exports = new AgriPestScannerService();
