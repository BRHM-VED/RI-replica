// Reidius Infra - Interactive Cost Calculator Logic

document.addEventListener('DOMContentLoaded', () => {
  initCalculator();
});

function initCalculator() {
  const areaInput = document.getElementById('calc-area');
  const areaVal = document.getElementById('calc-area-val');
  const floorsButtons = document.querySelectorAll('.floor-btn');
  const locationSelect = document.getElementById('calc-location');
  const cementSelect = document.getElementById('calc-cement');
  const addonChecks = document.querySelectorAll('.addon-check');
  
  // Outputs
  const materialCostEl = document.getElementById('out-material');
  const labourCostEl = document.getElementById('out-labour');
  const designCostEl = document.getElementById('out-design');
  const totalCostEl = document.getElementById('out-total');

  if (!areaInput || !totalCostEl) return;

  // State
  let currentArea = parseInt(areaInput.value);
  let currentFloors = 1; // 1 = Ground Only, 2 = Ground + 1, etc.
  let locationMultiplier = 1.0;
  let cementMultiplier = 1.0;
  let addonRate = 0; // flat rate additions per sq.ft.
  
  // Rate base per sq.ft. in Jaipur
  const BASE_RATE = 1600; 

  // Initialize display
  areaVal.textContent = currentArea.toLocaleString('en-IN');

  // Input listeners
  areaInput.addEventListener('input', (e) => {
    currentArea = parseInt(e.target.value);
    areaVal.textContent = currentArea.toLocaleString('en-IN');
    calculate();
  });

  floorsButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      floorsButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFloors = parseInt(btn.getAttribute('data-floors'));
      calculate();
    });
  });

  if (locationSelect) {
    locationSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'Jaipur') locationMultiplier = 1.0;
      else if (val === 'Bikaner') locationMultiplier = 0.95;
      else if (val === 'Bharatpur') locationMultiplier = 0.97;
      else locationMultiplier = 1.0;
      calculate();
    });
  }

  if (cementSelect) {
    cementSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'Ultratech') cementMultiplier = 1.05;
      else if (val === 'Ambuja') cementMultiplier = 1.03;
      else if (val === 'Wonder') cementMultiplier = 1.0;
      else if (val === 'Shree') cementMultiplier = 0.98;
      else cementMultiplier = 1.0;
      calculate();
    });
  }

  addonChecks.forEach(check => {
    check.addEventListener('change', () => {
      updateAddons();
      calculate();
    });
  });

  function updateAddons() {
    addonRate = 0;
    addonChecks.forEach(check => {
      if (check.checked) {
        const rate = parseInt(check.getAttribute('data-rate'));
        addonRate += rate;
      }
    });
  }

  // Formatting function for Indian Rupees
  function formatINR(amount) {
    return '₹ ' + Math.round(amount).toLocaleString('en-IN', {
      maximumFractionDigits: 0
    });
  }

  // Animation counter for cost outputs
  function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const current = progress * (end - start) + start;
      element.textContent = formatINR(current);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  // Save previous values for smooth counting transitions
  let prevMaterial = 0;
  let prevLabour = 0;
  let prevDesign = 0;
  let prevTotal = 0;

  function calculate() {
    // Floor multiplier
    let floorFactor = 1.0;
    if (currentFloors === 2) floorFactor = 1.05; // Ground + 1st
    if (currentFloors === 3) floorFactor = 1.10; // Ground + 2nd
    if (currentFloors === 4) floorFactor = 1.15; // Ground + 3rd
    if (currentFloors > 4) floorFactor = 1.22;  // Higher

    // Rate per sq.ft.
    const finalRate = (BASE_RATE * floorFactor * locationMultiplier * cementMultiplier) + addonRate;
    const finalTotal = currentArea * finalRate;

    // Split estimation percentages
    const materialCost = finalTotal * 0.58;
    const labourCost = finalTotal * 0.27;
    const designCost = finalTotal * 0.15;

    // Animate display updates
    animateValue(materialCostEl, prevMaterial, materialCost, 400);
    animateValue(labourCostEl, prevLabour, labourCost, 400);
    animateValue(designCostEl, prevDesign, designCost, 400);
    animateValue(totalCostEl, prevTotal, finalTotal, 400);

    // Save current values for next steps
    prevMaterial = materialCost;
    prevLabour = labourCost;
    prevDesign = designCost;
    prevTotal = finalTotal;
  }

  // Initial execution
  updateAddons();
  calculate();
}
