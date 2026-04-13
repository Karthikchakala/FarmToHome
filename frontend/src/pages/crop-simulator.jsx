export default function CropSimulator() {
  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 72px)', height: 'calc(100vh - 72px)', overflow: 'hidden', background: '#0f172a' }}>
      <iframe
        title="Crop Simulator"
        src="/simulator/index.html"
        style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
      />
    </div>
  )
}
