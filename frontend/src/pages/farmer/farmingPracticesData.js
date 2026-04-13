export const PRACTICES = {
  traditional: {
    label: 'Traditional Practices',
    number: '01',
    accentColor: '#718355',
    bannerBg: '#245501',
    cardBorder: '#97a97c',
    badgeBg: '#e9f5db',
    badgeText: '#245501',
    items: [
      { name: 'Crop Rotation', description: 'Rotating crops each season to restore soil nutrients naturally.', appliesTo: ['Rice', 'Wheat', 'Groundnut'], difficulty: 'Easy', cost: 'Low', category: 'traditional' },
      { name: 'Mulching', description: 'Covering soil with organic material to retain moisture.', appliesTo: ['Tomato', 'Chilli', 'Brinjal'], difficulty: 'Easy', cost: 'Low', category: 'traditional' },
      { name: 'Intercropping', description: 'Growing two crops together to maximize yield per acre.', appliesTo: ['Groundnut', 'Cotton', 'Maize'], difficulty: 'Medium', cost: 'Low', category: 'traditional' },
      { name: 'Raised Bed Farming', description: 'Elevated planting rows for better drainage and root growth.', appliesTo: ['Onion', 'Garlic', 'Carrot'], difficulty: 'Medium', cost: 'Medium', category: 'traditional' },
      { name: 'Composting', description: 'Converting farm waste into rich organic fertilizer.', appliesTo: ['All crops'], difficulty: 'Easy', cost: 'Low', category: 'traditional' },
      { name: 'Flood Irrigation', description: 'Traditional method of flooding fields for water-intensive crops.', appliesTo: ['Rice', 'Sugarcane'], difficulty: 'Easy', cost: 'Low', category: 'traditional' },
    ],
  },
  technology: {
    label: 'New Technology',
    number: '02',
    accentColor: '#538d22',
    bannerBg: '#143601',
    cardBorder: '#73a942',
    badgeBg: '#e9f5db',
    badgeText: '#143601',
    items: [
      { name: 'Drip Irrigation', description: 'Delivering water directly to roots, reducing waste by up to 60%.', appliesTo: ['Tomato', 'Chilli', 'Mango'], difficulty: 'Medium', cost: 'High', category: 'technology' },
      { name: 'Drone Spraying', description: 'Using drones to spray pesticides with precision and speed.', appliesTo: ['Rice', 'Cotton', 'Wheat'], difficulty: 'Hard', cost: 'High', category: 'technology' },
      { name: 'Soil Sensors', description: 'Electronic sensors that monitor moisture and nutrient levels.', appliesTo: ['All crops'], difficulty: 'Medium', cost: 'High', category: 'technology' },
      { name: 'Poly House Farming', description: 'Growing crops inside controlled plastic greenhouses.', appliesTo: ['Tomato', 'Capsicum', 'Cucumber'], difficulty: 'Hard', cost: 'High', category: 'technology' },
      { name: 'Fertigation', description: 'Delivering fertilizer through drip irrigation system directly to roots.', appliesTo: ['Banana', 'Mango', 'Tomato'], difficulty: 'Medium', cost: 'Medium', category: 'technology' },
      { name: 'GPS Field Mapping', description: 'Mapping farm boundaries and soil zones using GPS for precision farming.', appliesTo: ['All crops'], difficulty: 'Hard', cost: 'High', category: 'technology' },
    ],
  },
  organic: {
    label: 'Organic & Natural',
    number: '03',
    accentColor: '#245501',
    bannerBg: '#1a4301',
    cardBorder: '#73a942',
    badgeBg: '#cfe1b9',
    badgeText: '#143601',
    items: [
      { name: 'Vermicomposting', description: 'Using earthworms to convert organic waste into rich manure.', appliesTo: ['All crops'], difficulty: 'Easy', cost: 'Low', category: 'organic' },
      { name: 'Neem Pesticide', description: 'Natural neem-based spray that repels pests without chemicals.', appliesTo: ['Tomato', 'Chilli', 'Brinjal'], difficulty: 'Easy', cost: 'Low', category: 'organic' },
      { name: 'Green Manuring', description: 'Growing and ploughing in legume crops to enrich soil nitrogen.', appliesTo: ['Rice', 'Wheat', 'Cotton'], difficulty: 'Medium', cost: 'Low', category: 'organic' },
      { name: 'Companion Planting', description: 'Planting crops together that naturally repel each other pests.', appliesTo: ['Tomato', 'Maize', 'Onion'], difficulty: 'Medium', cost: 'Low', category: 'organic' },
      { name: 'Biofertilizers', description: 'Microorganism-based fertilizers that fix nitrogen from the air.', appliesTo: ['Groundnut', 'Soybean', 'Rice'], difficulty: 'Easy', cost: 'Low', category: 'organic' },
      { name: 'Natural Pest Traps', description: 'Yellow sticky traps and pheromone traps to catch insects.', appliesTo: ['Tomato', 'Cotton', 'Chilli'], difficulty: 'Easy', cost: 'Low', category: 'organic' },
    ],
  },
}

export const ALL_PRACTICES = [
  { name: 'Crop Rotation', description: 'Rotating crops each season to restore soil nutrients naturally.', appliesTo: ['Rice', 'Wheat', 'Groundnut'], difficulty: 'Easy', cost: 'Low', category: 'traditional' },
  { name: 'Mulching', description: 'Covering soil with organic material to retain moisture.', appliesTo: ['Tomato', 'Chilli', 'Brinjal'], difficulty: 'Easy', cost: 'Low', category: 'traditional' },
  { name: 'Intercropping', description: 'Growing two crops together to maximize yield per acre.', appliesTo: ['Groundnut', 'Cotton', 'Maize'], difficulty: 'Medium', cost: 'Low', category: 'traditional' },
  { name: 'Raised Bed Farming', description: 'Elevated planting rows for better drainage and root growth.', appliesTo: ['Onion', 'Garlic', 'Carrot'], difficulty: 'Medium', cost: 'Medium', category: 'traditional' },
  { name: 'Composting', description: 'Converting farm waste into rich organic fertilizer.', appliesTo: ['All crops'], difficulty: 'Easy', cost: 'Low', category: 'traditional' },
  { name: 'Flood Irrigation', description: 'Traditional method of flooding fields for water-intensive crops.', appliesTo: ['Rice', 'Sugarcane'], difficulty: 'Easy', cost: 'Low', category: 'traditional' },
  { name: 'Drip Irrigation', description: 'Delivering water directly to roots, reducing waste by up to 60%.', appliesTo: ['Tomato', 'Chilli', 'Mango'], difficulty: 'Medium', cost: 'High', category: 'technology' },
  { name: 'Drone Spraying', description: 'Using drones to spray pesticides with precision and speed.', appliesTo: ['Rice', 'Cotton', 'Wheat'], difficulty: 'Hard', cost: 'High', category: 'technology' },
  { name: 'Soil Sensors', description: 'Electronic sensors that monitor moisture and nutrient levels.', appliesTo: ['All crops'], difficulty: 'Medium', cost: 'High', category: 'technology' },
  { name: 'Poly House Farming', description: 'Growing crops inside controlled plastic greenhouses.', appliesTo: ['Tomato', 'Capsicum', 'Cucumber'], difficulty: 'Hard', cost: 'High', category: 'technology' },
  { name: 'Fertigation', description: 'Delivering fertilizer through drip irrigation system directly to roots.', appliesTo: ['Banana', 'Mango', 'Tomato'], difficulty: 'Medium', cost: 'Medium', category: 'technology' },
  { name: 'GPS Field Mapping', description: 'Mapping farm boundaries and soil zones using GPS for precision farming.', appliesTo: ['All crops'], difficulty: 'Hard', cost: 'High', category: 'technology' },
  { name: 'Vermicomposting', description: 'Using earthworms to convert organic waste into rich manure.', appliesTo: ['All crops'], difficulty: 'Easy', cost: 'Low', category: 'organic' },
  { name: 'Neem Pesticide', description: 'Natural neem-based spray that repels pests without chemicals.', appliesTo: ['Tomato', 'Chilli', 'Brinjal'], difficulty: 'Easy', cost: 'Low', category: 'organic' },
  { name: 'Green Manuring', description: 'Growing and ploughing in legume crops to enrich soil nitrogen.', appliesTo: ['Rice', 'Wheat', 'Cotton'], difficulty: 'Medium', cost: 'Low', category: 'organic' },
  { name: 'Companion Planting', description: 'Planting crops together that naturally repel each other pests.', appliesTo: ['Tomato', 'Maize', 'Onion'], difficulty: 'Medium', cost: 'Low', category: 'organic' },
  { name: 'Biofertilizers', description: 'Microorganism-based fertilizers that fix nitrogen from the air.', appliesTo: ['Groundnut', 'Soybean', 'Rice'], difficulty: 'Easy', cost: 'Low', category: 'organic' },
  { name: 'Natural Pest Traps', description: 'Yellow sticky traps and pheromone traps to catch insects.', appliesTo: ['Tomato', 'Cotton', 'Chilli'], difficulty: 'Easy', cost: 'Low', category: 'organic' },
]

export const PRACTICE_DETAILS = {
  'crop-rotation': {
    what: 'Crop rotation is the practice of growing different types of crops in the same area across different growing seasons. This ancient technique breaks pest and disease cycles, replenishes soil nutrients, and reduces the need for synthetic fertilizers. Each crop family uses and adds different nutrients, so alternating them keeps the soil in balance naturally. A well-planned rotation can reduce fertilizer costs by 20-30% and increase yields by 10-15% over 3-5 years.',
    why: ['Breaks the life cycle of soil-borne pests and diseases that target specific crops', 'Legumes fix atmospheric nitrogen, reducing fertilizer cost for the next crop', 'Prevents soil erosion and compaction by varying root structures each season', 'Improves long-term soil health, leading to higher yields over multiple years', 'Reduces weed pressure as different crops compete differently with weeds'],
    steps: ['Divide your farm into at least 2-3 sections', 'Plan the rotation sequence: e.g., Rice then Groundnut then Wheat then Fallow', 'After harvest, leave crop residue in the field to decompose before the next planting', 'Introduce a legume (groundnut, cowpea, green gram) at least once in the 3-year cycle', 'Do not plant the same crop family in the same plot two seasons in a row', 'Keep a written record of each plot crop history for at least 3 years'],
    costs: [{ item: 'Planning and marking', amount: 'Rs 0 (time only)' }, { item: 'Seeds for rotation crop', amount: 'Rs 300 - Rs 800/acre' }, { item: 'Additional labour (if new crop)', amount: 'Rs 500 - Rs 1,500/acre' }],
    related: ['Mulching', 'Composting', 'Intercropping'],
  },
  mulching: {
    what: 'Mulching involves covering the soil surface around plants with organic or inorganic material. Organic mulches include straw, dried leaves, sugarcane bagasse, and paddy husk. Inorganic mulches include black plastic film. Mulching conserves soil moisture by reducing evaporation by up to 50%, suppresses weed growth, moderates soil temperature, and as organic mulches decompose, they add nutrients and improve soil structure.',
    why: ['Reduces irrigation frequency by 30-50% by conserving soil moisture', 'Suppresses weed growth, reducing weeding labour costs significantly', 'Moderates soil temperature, protecting roots from extreme heat and cold', 'Organic mulches decompose and improve soil organic matter over time', 'Prevents soil splash and erosion during heavy rainfall'],
    steps: ['Clear weeds from the field before applying mulch', 'Water the soil thoroughly before mulching', 'Apply organic mulch (straw, dried leaves) 5-8 cm thick around plants', 'Leave a small gap of 5 cm around the plant stem to prevent stem rot', 'For plastic mulch, lay the film before transplanting and cut holes for plants', 'Replenish organic mulch as it decomposes, typically every 2-3 months'],
    costs: [{ item: 'Paddy straw or sugarcane bagasse', amount: 'Rs 200 - Rs 500/acre' }, { item: 'Black plastic mulch film', amount: 'Rs 2,000 - Rs 4,000/acre' }, { item: 'Labour for application', amount: 'Rs 300 - Rs 600/acre' }],
    related: ['Composting', 'Drip Irrigation', 'Raised Bed Farming'],
  },
  intercropping: {
    what: 'Intercropping is the practice of growing two or more crops simultaneously in the same field. The crops are chosen so that they complement each other - one may fix nitrogen while the other uses it, or one may have a deep root system while the other is shallow. Common Indian intercropping systems include groundnut with castor, cotton with cowpea, and maize with beans. This practice maximises land use efficiency and provides income security if one crop fails.',
    why: ['Maximises land use efficiency - more output from the same area', 'Provides income security if one crop fails due to pest or weather', 'Legume intercrops fix nitrogen, reducing fertilizer needs for the main crop', 'Reduces pest and disease pressure through crop diversity', 'Improves soil structure through varied root systems'],
    steps: ['Choose crops with complementary growth habits (tall with short, deep-rooted with shallow)', 'Plan row ratios: e.g., 4 rows of main crop to 2 rows of intercrop', 'Sow the main crop first, then the intercrop 2-3 weeks later', 'Ensure the intercrop does not shade the main crop during critical growth stages', 'Harvest the shorter-duration crop first without disturbing the main crop', 'Record yield of both crops separately to evaluate profitability'],
    costs: [{ item: 'Additional seeds for intercrop', amount: 'Rs 200 - Rs 600/acre' }, { item: 'Extra labour for planting', amount: 'Rs 300 - Rs 500/acre' }, { item: 'Separate harvesting cost', amount: 'Rs 400 - Rs 800/acre' }],
    related: ['Crop Rotation', 'Companion Planting', 'Raised Bed Farming'],
  },
  'raised-bed-farming': {
    what: 'Raised bed farming involves creating elevated planting areas (15-30 cm high) separated by furrows or pathways. The beds are typically 90-120 cm wide so farmers can reach the center without stepping on the bed. This system improves drainage, prevents waterlogging, allows better root aeration, and makes irrigation and fertilizer application more efficient. It is particularly effective for vegetables, onions, garlic, and root crops.',
    why: ['Prevents waterlogging and improves drainage in heavy soils', 'Soil warms up faster in raised beds, enabling earlier planting', 'Better root aeration leads to healthier plants and higher yields', 'Concentrated fertilizer application reduces input waste', 'Easier weed management as pathways are clearly defined'],
    steps: ['Mark out bed width of 90-120 cm with pathways of 30-45 cm between beds', 'Loosen soil to 30 cm depth and incorporate compost or FYM at 5-10 tonnes/acre', 'Shape the bed with a slight crown (higher in center) for water runoff', 'Install drip lines along the bed before planting for efficient irrigation', 'Plant in double or triple rows along the bed length', 'Maintain bed shape by adding soil from pathways after each season'],
    costs: [{ item: 'Bed formation labour', amount: 'Rs 1,500 - Rs 3,000/acre' }, { item: 'Compost/FYM incorporation', amount: 'Rs 2,000 - Rs 4,000/acre' }, { item: 'Drip system (optional)', amount: 'Rs 15,000 - Rs 25,000/acre' }],
    related: ['Drip Irrigation', 'Mulching', 'Fertigation'],
  },
  composting: {
    what: 'Composting is the controlled decomposition of organic materials (crop residues, animal manure, kitchen waste) into a stable, nutrient-rich soil amendment called compost. Well-made compost contains 1-3% nitrogen, 0.5-1% phosphorus, and 1-2% potassium, plus micronutrients and beneficial microorganisms. Regular compost application improves soil structure, water-holding capacity, and biological activity. It is the foundation of sustainable farming.',
    why: ['Improves soil structure and water-holding capacity in both sandy and clay soils', 'Provides slow-release nutrients that are available to plants over months', 'Introduces beneficial microorganisms that suppress soil-borne diseases', 'Reduces dependence on expensive chemical fertilizers by 30-50%', 'Converts farm waste into a valuable resource, reducing disposal costs'],
    steps: ['Collect organic materials: crop residues, animal dung, kitchen waste, dry leaves', 'Layer materials in a ratio of 3 parts brown (dry) to 1 part green (fresh)', 'Maintain moisture - the pile should feel like a wrung-out sponge', 'Turn the pile every 2-3 weeks to aerate and speed decomposition', 'Compost is ready in 2-3 months when it is dark, crumbly, and earthy-smelling', 'Apply 2-5 tonnes per acre before planting and incorporate into soil'],
    costs: [{ item: 'Labour for collection and turning', amount: 'Rs 500 - Rs 1,000/acre' }, { item: 'Compost pit construction (one-time)', amount: 'Rs 2,000 - Rs 5,000' }, { item: 'Inoculant (optional, speeds process)', amount: 'Rs 100 - Rs 300' }],
    related: ['Vermicomposting', 'Green Manuring', 'Crop Rotation'],
  },
  'flood-irrigation': {
    what: 'Flood irrigation (also called surface irrigation) involves releasing water at the top of a field and allowing it to flow by gravity across the field surface. It is the oldest and most widely used irrigation method in India, particularly for rice and sugarcane. While it requires minimal infrastructure, it is water-inefficient (only 40-50% of water reaches plant roots) and can cause waterlogging and soil erosion if not managed properly.',
    why: ['Lowest infrastructure cost of all irrigation methods', 'Suitable for flat fields with impermeable soils like clay', 'Effective for crops that require standing water like paddy rice', 'No energy cost if water source is at higher elevation', 'Familiar to most farmers with minimal training required'],
    steps: ['Level the field carefully - maximum slope of 0.2% for efficient water distribution', 'Construct field channels (bunds) to direct water flow', 'Open the water inlet and allow water to spread across the field', 'Monitor water depth - rice requires 5-10 cm standing water', 'Close inlet when water reaches the far end of the field', 'Allow field to dry between irrigations to prevent waterlogging'],
    costs: [{ item: 'Field levelling (one-time)', amount: 'Rs 3,000 - Rs 8,000/acre' }, { item: 'Bund construction and maintenance', amount: 'Rs 500 - Rs 1,500/season' }, { item: 'Water charges (canal)', amount: 'Rs 500 - Rs 2,000/season' }],
    related: ['Drip Irrigation', 'Raised Bed Farming', 'Soil Sensors'],
  },
  'drip-irrigation': {
    what: 'Drip irrigation delivers water directly to the root zone of plants through a network of pipes, tubes, and emitters. Water drips slowly at 2-8 litres per hour, maintaining optimal soil moisture without waterlogging. This system reduces water use by 40-60% compared to flood irrigation, reduces weed growth (only the root zone is wetted), and can be combined with fertigation to deliver nutrients directly to roots. It is the most efficient irrigation method available.',
    why: ['Reduces water consumption by 40-60% compared to flood irrigation', 'Increases crop yield by 20-50% through optimal moisture management', 'Reduces weed growth as only the root zone receives water', 'Enables fertigation - delivering fertilizers directly to roots', 'Reduces labour costs for irrigation and weeding'],
    steps: ['Design the system based on field size, crop spacing, and water source pressure', 'Install the main line, sub-main lines, and lateral pipes', 'Place drip emitters at each plant or between plants depending on crop type', 'Install a filter (sand + screen) to prevent emitter clogging', 'Test the system for uniform water distribution before planting', 'Flush the system monthly and check emitters for clogging regularly'],
    costs: [{ item: 'Drip system installation', amount: 'Rs 15,000 - Rs 35,000/acre' }, { item: 'Government subsidy (PMKSY)', amount: '45-55% of cost covered' }, { item: 'Annual maintenance', amount: 'Rs 1,000 - Rs 2,500/acre' }],
    related: ['Fertigation', 'Mulching', 'Raised Bed Farming'],
  },
  'drone-spraying': {
    what: 'Agricultural drones equipped with spray tanks can cover 1 acre in 10-15 minutes, compared to 2-3 hours for manual spraying. They use GPS for precise navigation, ensuring uniform coverage and reducing chemical waste by 30-40%. Drones can access difficult terrain, reduce farmer exposure to pesticides, and spray at optimal times (early morning or evening) without disturbing crops. In India, drone spraying services are available at Rs 400-600 per acre through custom hiring centres.',
    why: ['Covers 1 acre in 10-15 minutes vs 2-3 hours for manual spraying', 'Reduces pesticide use by 30-40% through precise, uniform application', 'Eliminates farmer exposure to harmful chemicals', 'Can spray at optimal times without crop damage from foot traffic', 'GPS-guided for consistent coverage, even in difficult terrain'],
    steps: ['Hire a licensed drone operator or custom hiring centre', 'Prepare the spray solution at recommended concentration', 'Mark field boundaries and identify obstacles (trees, power lines)', 'Set flight path parameters - typically 3-5 metres above crop canopy', 'Monitor spray coverage and refill tank as needed', 'Record application date, chemical used, and dosage for compliance'],
    costs: [{ item: 'Drone spraying service (hiring)', amount: 'Rs 400 - Rs 600/acre' }, { item: 'Pesticide/fungicide cost', amount: 'Rs 500 - Rs 2,000/acre' }, { item: 'Own drone purchase (if buying)', amount: 'Rs 4,00,000 - Rs 8,00,000' }],
    related: ['Soil Sensors', 'GPS Field Mapping', 'Neem Pesticide'],
  },
  'soil-sensors': {
    what: 'Soil sensors are electronic devices inserted into the soil to continuously monitor moisture, temperature, electrical conductivity (salinity), and sometimes pH and nutrient levels. Data is transmitted wirelessly to a smartphone app or computer, enabling farmers to make precise irrigation and fertilization decisions. Modern sensors cost Rs 3,000-15,000 per unit and can pay for themselves within one season through water and fertilizer savings.',
    why: ['Eliminates guesswork in irrigation scheduling - irrigate only when needed', 'Prevents both under-irrigation (stress) and over-irrigation (waterlogging)', 'Reduces water consumption by 20-40% through data-driven decisions', 'Early detection of soil salinity buildup before it damages crops', 'Remote monitoring via smartphone - no need to visit field daily'],
    steps: ['Select sensors appropriate for your soil type and crops', 'Install sensors at root depth (15-30 cm) and deeper (45-60 cm) for comparison', 'Connect sensors to a data logger or IoT gateway for wireless transmission', 'Set threshold alerts - irrigate when moisture drops below field capacity', 'Calibrate sensors for your specific soil type using lab analysis', 'Download and analyse data weekly to identify patterns and optimise irrigation'],
    costs: [{ item: 'Soil moisture sensor (per unit)', amount: 'Rs 3,000 - Rs 15,000' }, { item: 'Data logger/gateway', amount: 'Rs 5,000 - Rs 20,000' }, { item: 'Installation and setup', amount: 'Rs 1,000 - Rs 3,000' }],
    related: ['Drip Irrigation', 'GPS Field Mapping', 'Fertigation'],
  },
  'poly-house-farming': {
    what: 'Poly house farming involves growing crops inside a structure covered with UV-stabilised polyethylene film. The controlled environment protects crops from extreme weather, pests, and diseases, enabling year-round production of high-value vegetables and flowers. Temperature, humidity, and ventilation can be managed to create optimal growing conditions. While the initial investment is high (Rs 7-15 lakh per acre), returns from high-value crops like capsicum, cucumber, and gerbera can be 3-5 times higher than open field cultivation.',
    why: ['Year-round production regardless of season or weather', 'Protection from pests and diseases reduces pesticide use by 60-80%', 'Controlled environment enables 2-3 crops per year instead of 1', 'Premium prices for off-season produce in local and export markets', 'Government subsidies available under NHM for 50-65% of cost'],
    steps: ['Select a site with good sunlight (minimum 6 hours direct sun) and water access', 'Apply for government subsidy under National Horticulture Mission before construction', 'Construct the structure with GI pipes and UV-stabilised polyfilm (200 micron)', 'Install drip irrigation and fertigation system inside the poly house', 'Prepare raised beds with coco peat or soil-less growing media', 'Maintain temperature below 35 degrees C using shade nets and ventilation fans'],
    costs: [{ item: 'Poly house construction', amount: 'Rs 7,00,000 - Rs 15,00,000/acre' }, { item: 'Government subsidy (NHM)', amount: '50-65% of project cost' }, { item: 'Drip and fertigation system', amount: 'Rs 1,50,000 - Rs 3,00,000/acre' }],
    related: ['Drip Irrigation', 'Fertigation', 'Soil Sensors'],
  },
  fertigation: {
    what: 'Fertigation is the application of fertilizers through the drip irrigation system, delivering nutrients directly to the root zone in dissolved form. Plants absorb nutrients more efficiently when they are dissolved in water and delivered directly to roots. Fertigation reduces fertilizer use by 25-40% compared to broadcast application, minimises nutrient loss through leaching and volatilisation, and enables precise timing of nutrient delivery to match crop demand at each growth stage.',
    why: ['Reduces fertilizer use by 25-40% through precise root-zone delivery', 'Nutrients are immediately available to plants in dissolved form', 'Enables stage-wise nutrition management matching crop demand', 'Reduces labour cost of manual fertilizer application', 'Minimises nutrient loss through leaching, runoff, and volatilisation'],
    steps: ['Ensure drip system is installed and functioning with clean filters', 'Prepare fertilizer solution in a mixing tank (venturi injector or pump)', 'Use water-soluble fertilizers: urea, MAP, MKP, calcium nitrate, potassium nitrate', 'Inject fertilizer solution for 20-30 minutes in the middle of the irrigation cycle', 'Flush the system with plain water for 10-15 minutes after fertigation', 'Follow a fertigation schedule based on crop growth stage and soil test results'],
    costs: [{ item: 'Fertigation equipment (venturi/pump)', amount: 'Rs 3,000 - Rs 15,000' }, { item: 'Water-soluble fertilizers', amount: '20-30% more than granular but less quantity needed' }, { item: 'Soil/water testing for schedule', amount: 'Rs 500 - Rs 1,500' }],
    related: ['Drip Irrigation', 'Soil Sensors', 'Raised Bed Farming'],
  },
  'gps-field-mapping': {
    what: 'GPS field mapping uses satellite positioning technology to create precise digital maps of farm boundaries, soil zones, drainage patterns, and crop health. Farmers use smartphone apps or dedicated GPS devices to walk field boundaries and record data. These maps enable variable rate application of inputs (applying more fertilizer where soil is deficient, less where it is adequate), precise area calculation for insurance and subsidy claims, and integration with drone and tractor guidance systems.',
    why: ['Precise area measurement for accurate input planning and subsidy claims', 'Identifies soil variability zones for variable rate fertilizer application', 'Enables tractor auto-steering for straight rows and reduced overlap', 'Historical maps help track field changes and crop performance over years', 'Required for precision agriculture and smart farming certifications'],
    steps: ['Download a GPS mapping app (e.g., Field Area Measure, Google Earth Pro)', 'Walk the field boundary with your smartphone to record GPS coordinates', 'Mark internal features: drainage channels, trees, problem areas', 'Upload data to a farm management platform for analysis', 'Use the map to plan input application zones and irrigation layout', 'Update maps annually to track changes in field conditions'],
    costs: [{ item: 'GPS mapping app (basic)', amount: 'Free - Rs 2,000/year' }, { item: 'Professional GPS device', amount: 'Rs 15,000 - Rs 50,000' }, { item: 'Soil sampling and analysis', amount: 'Rs 1,000 - Rs 3,000/acre' }],
    related: ['Drone Spraying', 'Soil Sensors', 'Drip Irrigation'],
  },
  vermicomposting: {
    what: 'Vermicomposting uses earthworms (typically Eisenia fetida or Lumbricus rubellus) to convert organic waste into vermicompost, a nutrient-rich soil amendment that is superior to regular compost. Earthworms digest organic matter and excrete worm castings that contain 5 times more nitrogen, 7 times more phosphorus, and 11 times more potassium than ordinary soil. Vermicompost also contains plant growth hormones and beneficial microorganisms that suppress soil diseases.',
    why: ['Produces nutrient-rich compost 3-4 times faster than conventional composting', 'Vermicompost contains plant growth hormones not found in chemical fertilizers', 'Improves soil structure, aeration, and water-holding capacity significantly', 'Suppresses soil-borne diseases through beneficial microbial activity', 'Can be sold as a premium product at Rs 8-15 per kg'],
    steps: ['Construct a vermicompost bed (1m x 2m x 0.5m) using bricks or concrete', 'Add a 10 cm layer of moist bedding material (coir pith, dried leaves)', 'Introduce 1-2 kg of earthworms per square metre of bed area', 'Add organic waste (vegetable scraps, crop residues, cow dung) in thin layers', 'Maintain moisture at 60-70% and temperature below 35 degrees C', 'Harvest vermicompost after 45-60 days when it is dark and granular'],
    costs: [{ item: 'Bed construction (one-time)', amount: 'Rs 2,000 - Rs 5,000' }, { item: 'Earthworm purchase', amount: 'Rs 200 - Rs 400 per kg' }, { item: 'Shade net for bed', amount: 'Rs 500 - Rs 1,500' }],
    related: ['Composting', 'Green Manuring', 'Biofertilizers'],
  },
  'neem-pesticide': {
    what: 'Neem-based pesticides are derived from the seeds and leaves of the neem tree (Azadirachta indica). The active compound azadirachtin disrupts the hormonal system of insects, preventing them from feeding, moulting, and reproducing. Neem products are effective against over 200 insect species including aphids, whiteflies, thrips, and leaf miners. Unlike synthetic pesticides, neem does not harm beneficial insects like bees and ladybirds, and breaks down within 4-8 days leaving no harmful residues.',
    why: ['Effective against 200+ insect species without harming beneficial insects', 'Breaks down within 4-8 days leaving no harmful residues in soil or produce', 'Insects cannot develop resistance to neem as they do to synthetic pesticides', 'Safe for farmers, consumers, and the environment', 'Can be prepared on-farm from neem seeds at very low cost'],
    steps: ['Collect ripe neem seeds and dry them in shade for 3-5 days', 'Crush seeds and soak 5 kg in 10 litres of water overnight', 'Strain the solution through a cloth to remove seed particles', 'Add 5 ml of liquid soap per litre as an emulsifier', 'Dilute to 3-5% concentration and spray on affected plants', 'Apply in the evening to avoid UV degradation and protect bees'],
    costs: [{ item: 'Neem seeds (farm-collected)', amount: 'Rs 0 - Rs 50/kg' }, { item: 'Commercial neem oil (1 litre)', amount: 'Rs 200 - Rs 400' }, { item: 'Commercial neem cake (50 kg)', amount: 'Rs 300 - Rs 600' }],
    related: ['Natural Pest Traps', 'Companion Planting', 'Biofertilizers'],
  },
  'green-manuring': {
    what: 'Green manuring involves growing a crop specifically to be ploughed back into the soil while still green, to improve soil fertility and structure. Leguminous green manure crops like dhaincha (Sesbania), sunhemp (Crotalaria), and cowpea fix 80-150 kg of nitrogen per acre from the atmosphere. When ploughed in, they decompose rapidly and release nutrients for the next crop. Green manuring is particularly valuable before rice transplanting and can replace 30-50 kg of urea per acre.',
    why: ['Fixes 80-150 kg of nitrogen per acre from the atmosphere at no cost', 'Improves soil organic matter and microbial activity', 'Suppresses weeds during the green manure crop growth period', 'Improves soil structure and water-holding capacity', 'Can replace 30-50 kg of urea per acre, saving Rs 600-1,000'],
    steps: ['Select appropriate green manure crop: dhaincha for waterlogged conditions, sunhemp for upland', 'Sow seeds broadcast at 20-25 kg per acre after the previous crop harvest', 'Allow the crop to grow for 45-60 days until flowering stage', 'Plough the green crop into the soil when it is at maximum biomass', 'Allow 2-3 weeks for decomposition before planting the next crop', 'Irrigate after ploughing to speed decomposition'],
    costs: [{ item: 'Green manure seeds (dhaincha/sunhemp)', amount: 'Rs 400 - Rs 800/acre' }, { item: 'Sowing labour', amount: 'Rs 200 - Rs 400/acre' }, { item: 'Ploughing cost', amount: 'Rs 500 - Rs 1,000/acre' }],
    related: ['Composting', 'Crop Rotation', 'Biofertilizers'],
  },
  'companion-planting': {
    what: 'Companion planting is the practice of growing different plants in close proximity for mutual benefit. Some plants repel pests that attack their neighbours, others attract beneficial insects, and some improve soil conditions for nearby plants. Classic Indian companion planting combinations include maize with beans (beans fix nitrogen, maize provides support), tomato with basil (basil repels aphids and whiteflies), and onion with carrot (onion repels carrot fly, carrot repels onion fly).',
    why: ['Natural pest repellent - certain plants deter specific insects from neighbours', 'Attracts beneficial insects like ladybirds and parasitic wasps that control pests', 'Maximises space utilisation with complementary growth habits', 'Reduces need for pesticides through natural pest management', 'Some combinations improve flavour and yield of both crops'],
    steps: ['Research compatible plant combinations for your target crops', 'Plan the layout: border planting, row intercropping, or random mixing', 'Plant companion crops simultaneously or 2-3 weeks before the main crop', 'Maintain adequate spacing so companions do not compete for light', 'Observe and record which combinations work best in your conditions', 'Avoid incompatible combinations: fennel inhibits most vegetables'],
    costs: [{ item: 'Companion crop seeds', amount: 'Rs 100 - Rs 400/acre' }, { item: 'Additional planting labour', amount: 'Rs 200 - Rs 500/acre' }, { item: 'No additional inputs required', amount: 'Rs 0' }],
    related: ['Intercropping', 'Neem Pesticide', 'Natural Pest Traps'],
  },
  biofertilizers: {
    what: 'Biofertilizers are preparations containing living microorganisms that, when applied to seeds, soil, or plant surfaces, colonise the rhizosphere and promote plant growth by increasing nutrient availability. Rhizobium bacteria fix atmospheric nitrogen in legume root nodules. Azospirillum and Azotobacter fix nitrogen in non-legume crops. Phosphate-solubilising bacteria (PSB) convert insoluble phosphorus into plant-available forms. Regular use of biofertilizers can reduce chemical fertilizer use by 20-30% and improve soil health over time.',
    why: ['Rhizobium can fix 50-200 kg of nitrogen per acre in legume crops', 'PSB can mobilise 20-30 kg of phosphorus per acre from soil reserves', 'Improves root growth and plant vigour through hormone production', 'Reduces chemical fertilizer requirement by 20-30%', 'Improves soil microbial diversity and long-term soil health'],
    steps: ['Purchase biofertilizer packets from a reputable source (check expiry date)', 'Mix biofertilizer with jaggery solution (250 g jaggery in 500 ml water) as carrier', 'Coat seeds with the mixture and dry in shade for 30 minutes before sowing', 'For soil application, mix with compost and broadcast before planting', 'Do not mix biofertilizers with chemical fertilizers or fungicides', 'Store in a cool, dark place and use before expiry date'],
    costs: [{ item: 'Rhizobium/Azospirillum packet (200g)', amount: 'Rs 30 - Rs 80' }, { item: 'PSB packet (200g)', amount: 'Rs 30 - Rs 80' }, { item: 'Carrier material (jaggery)', amount: 'Rs 20 - Rs 50' }],
    related: ['Vermicomposting', 'Green Manuring', 'Composting'],
  },
  'natural-pest-traps': {
    what: 'Natural pest traps use physical or chemical attractants to monitor and control insect pest populations without chemicals. Yellow sticky traps attract and trap aphids, whiteflies, thrips, and fungus gnats. Blue sticky traps are effective for thrips specifically. Pheromone traps use synthetic sex attractants to lure and trap male moths of specific pests like bollworm, fruit borer, and stem borer. Light traps attract a wide range of nocturnal insects. These traps serve both as monitoring tools and as control measures.',
    why: ['No chemical residues on produce or in soil', 'Effective monitoring tool to detect pest presence before damage occurs', 'Pheromone traps are highly specific - only target the pest species', 'Reduces pesticide use by 30-50% when used as part of IPM', 'Safe for beneficial insects, farmers, and consumers'],
    steps: ['Install yellow sticky traps at crop canopy height, 1 trap per 250 sq metres', 'Place pheromone traps at 15-20 per acre for bollworm and fruit borer monitoring', 'Check traps every 3-5 days and record pest counts', 'Replace sticky traps when they are full (typically every 2-4 weeks)', 'Replace pheromone lures every 4-6 weeks as per manufacturer instructions', 'Use trap counts to decide when chemical intervention is necessary (economic threshold)'],
    costs: [{ item: 'Yellow sticky traps (pack of 25)', amount: 'Rs 150 - Rs 300' }, { item: 'Pheromone trap with lure', amount: 'Rs 80 - Rs 150 per trap' }, { item: 'Light trap (solar)', amount: 'Rs 2,000 - Rs 5,000' }],
    related: ['Neem Pesticide', 'Companion Planting', 'Drone Spraying'],
  },
}

export const toSlug = (name) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

export const diffStyle = (difficulty) => {
  if (difficulty === 'Easy') return { bg: '#e9f5db', text: '#245501' }
  if (difficulty === 'Medium') return { bg: '#f0ead2', text: '#a98467' }
  return { bg: '#fee2e2', text: '#991b1b' }
}

export const costSymbol = (cost) => {
  if (cost === 'Low') return 'Rs Low'
  if (cost === 'Medium') return 'Rs Rs Med'
  return 'Rs Rs Rs High'
}
