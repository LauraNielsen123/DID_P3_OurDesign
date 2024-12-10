let table;
let days;
let textData = ''; // String til at holde tekstdata for den valgte dag
let container; // Div container for at vise tekst
let selectedDayIndex = 0; // Indeks for den valgte dag
let sleepTimeText = ""; // Tekst for den totale sovetid
let totalSleepHours = 0;
let remainingMinutes = 0;

let sleepDurations = []; // Array til at holde søvntimer for hver dag
let stageTotals = {}; // Objekt til at gemme total tid for hvert søvnstadie for den valgte dag

let daySelector; // Dropdown til at vælge dag

// Søvnstadier med mappings
const valueMapping = {
  'HKCategoryValueSleepAnalysisAsleepCore': 'Core',
  'HKCategoryValueSleepAnalysisAsleepDeep': 'Deep',
  'HKCategoryValueSleepAnalysisAsleepREM': 'REM',
  'HKCategoryValueSleepAnalysisAwake': 'Awake'
};

// Farver for hvert søvnstadie
const stageColors = {
   "Awake": "#F29E0D",
  "Core": "#60AFFF",
  "Deep": "#011993",
  "REM": "#7A81FF",
  "Sleep":"#0D61F2"
};

function preload() {
  // Load the CSV file
  table = loadTable('cleaned_sleep_Sofie.csv', 'csv', 'header');
}

function setup() {
  createCanvas(500, 1000); // Justeret for at give plads til alle grafer
  noLoop();

  // Opret dropdown-menu til valg af dag
  daySelector = createSelect();
  daySelector.position(10, 10); // Placer dropdown-menuen
  daySelector.option('Vælg Dag'); // Standardvalg
  days = [
    { start: new Date('2024-10-29T20:00:00'), end: new Date('2024-10-30T11:00:00'), day: 1 },
    { start: new Date('2024-10-30T20:00:00'), end: new Date('2024-10-31T11:00:00'), day: 2 },
    { start: new Date('2024-10-31T20:00:00'), end: new Date('2024-11-01T11:00:00'), day: 3 },
    { start: new Date('2024-11-01T20:00:00'), end: new Date('2024-11-02T11:00:00'), day: 4 }, 
    { start: new Date('2024-11-02T20:00:00'), end: new Date('2024-11-03T11:00:00'), day: 5 },
    { start: new Date('2024-11-03T20:00:00'), end: new Date('2024-11-04T11:00:00'), day: 6 },
    { start: new Date('2024-11-04T20:00:00'), end: new Date('2024-11-05T11:00:00'), day: 7 },
    { start: new Date('2024-12-02T20:00:00'), end: new Date('2024-12-03T11:00:00'), day: 7 },
    { start: new Date('2024-12-04T20:00:00'), end: new Date('2024-12-05T11:00:00'), day: 8 },
  ];
  days.forEach((day, index) => {
   // const formattedDate = day.start.toISOString().split('T')[0]; // YYYY-MM-DD
   const formattedDate = day.start.toISOString().split('T')[0].split('-').reverse().join('.'); //DD-MM-YYYY
  daySelector.option(formattedDate, index); // Tilføj hver dag som en mulighed
  });
  daySelector.changed(handleDayChange); // Tilknyt ændringshåndtering

  container = createDiv().style('overflow-y', 'scroll').style('height', '300px').style('width', '100%');
  container.position(0, 550); // Justeret for den nye canvas højde

  // Start med at vise data for dag 1
  calculateDayData(selectedDayIndex);
  draw(); // Tegn første gang baseret på dag 1
}

// Opdater visning ved valg af dag i dropdown
function handleDayChange() {
  selectedDayIndex = parseInt(daySelector.value()); // Opdater index baseret på valg
  calculateDayData(selectedDayIndex); // Beregn data for den valgte dag
  redraw(); // Tegn diagrammet igen med den nye data
}

// Beregn søvn- og søvnstadietider for den valgte dag
function calculateDayData(dayIndex) {
  let dayObj = days[dayIndex];
  
  // Beregn total søvntid og opdater "Gik i seng" og "Vågnede" tider for dagen
  let sleepTime = calculateTotalSleepTime(dayObj);
  if (sleepTime) {
    totalSleepHours = Math.floor(sleepTime.duration / 60);
    remainingMinutes = sleepTime.duration % 60;
    sleepTimeText = `${totalSleepHours} t ${remainingMinutes} m`;
    sleepDurations[dayIndex] = totalSleepHours + remainingMinutes / 60; // Opdater søvnduration for dagen

    // Tilføj "Gik i seng" og "Vågnede" tider til dayObj for senere brug
    dayObj.goToBed = sleepTime.start;
    dayObj.wakeUp = sleepTime.end;
  } else {
    sleepDurations[dayIndex] = 0;
    dayObj.goToBed = null;
    dayObj.wakeUp = null;
  }

  // Beregn søvnstadie-tider for dagen
  stageTotals = calculateStageTotals(dayObj);

  // Opdater tekstdata til visning
  //prepareTextDataForSelectedDay(dayIndex);
}

// Funktion til at opdatere tekstdata
function prepareTextDataForSelectedDay(dayIndex) {
  let dayObj = days[dayIndex];
  let totalsText = `<strong>Day ${dayObj.day}:</strong><br><strong>Detaljerede rækker:</strong><br>`;
  
  let rowCount = table.getRowCount();
  for (let i = 0; i < rowCount; i++) {
    let startDate = new Date(table.getString(i, 'start_date'));
    let endDate = new Date(table.getString(i, 'end_date'));
    let value = table.getString(i, 'value');

    if (startDate < dayObj.end && endDate > dayObj.start) {
      totalsText += `Start: ${startDate.toLocaleString()}, End: ${endDate.toLocaleString()}, Stage: ${value}<br>`;
    }
  }

  totalsText += "<br><strong>Total minutter pr. søvnstadie:</strong><br>";
  for (let stage in stageTotals) {
    let totalMinutes = stageTotals[stage];
    let hours = Math.floor(totalMinutes / 60);
    let minutes = totalMinutes % 60;
    totalsText += `${stage}: ${hours} timer, ${minutes} minutter<br>`;
  }

  if (dayObj.goToBed && dayObj.wakeUp) {
    totalsText += `<strong>Total sovetid:</strong> ${totalSleepHours} timer, ${remainingMinutes} minutter<br>`;
    totalsText += `Gik i seng: ${dayObj.goToBed.toLocaleString()}<br>`;
    totalsText += `Vågnede: ${dayObj.wakeUp.toLocaleString()}<br>`;
  }

  textData = totalsText;

  // Vis detaljeret tekstdata i HTML container
  container.html(textData);
}

// Beregning af totaler i minutter og timer for de forskellige stadier
function calculateStageTotals(dayObj) {
  let valueTotals = {}; 
  let rowCount = table.getRowCount();

  for (let i = 0; i < rowCount; i++) {
    let startDate = new Date(table.getString(i, 'start_date'));
    let endDate = new Date(table.getString(i, 'end_date'));
    let value = table.getString(i, 'value');

    if (startDate < dayObj.end && endDate > dayObj.start) {
      let duration = (endDate - startDate) / (1000 * 60);
      const displayValue = valueMapping[value] || value;

      if (!valueTotals[displayValue]) {
        valueTotals[displayValue] = 0;
      }
      valueTotals[displayValue] += duration;
    }
  }

  return valueTotals;
}

// Funktion til at beregne "Gik i seng" og "Vågnede" tider
function calculateTotalSleepTime(dayObj) {
  let firstStartDate = null;
  let lastEndDate = null;
  let rowCount = table.getRowCount();

  for (let i = 0; i < rowCount; i++) {
    let startDate = new Date(table.getString(i, 'start_date'));
    let endDate = new Date(table.getString(i, 'end_date'));

    if (startDate < dayObj.end && endDate > dayObj.start) {
      if (firstStartDate === null || startDate < firstStartDate) {
        firstStartDate = startDate;
      }
      if (lastEndDate === null || endDate > lastEndDate) {
        lastEndDate = endDate;
      }
    }
  }

  if (firstStartDate && lastEndDate) {
    let totalSleepDuration = (lastEndDate - firstStartDate) / (1000 * 60); // Total søvnvarighed i minutter
    return { duration: totalSleepDuration, start: firstStartDate, end: lastEndDate };
  }

  return null;
}



//Beregn procentdel af den stage sleep for den valgte dag
function calculatePercentage(stage) {
  const stageMinutes = stageTotals[stage] || 0; // Brug 0 hvis der ikke er deep sleep tid
  const totalMinutes = totalSleepHours * 60 + remainingMinutes;
  return totalMinutes > 0 ? ((stageMinutes / totalMinutes) * 100): "N/A";
  //return totalMinutes > 0 ? ((stageMinutes / totalMinutes) * 100).toFixed(1) : "N/A"; // Afrundet til 1 decimal
}

// Vertikal graf for "Optimal søvn" og "Din søvn"
function drawVerticalBars(sleepTotalMinutes) {
  
  const baseX = 75; // Start X-position
  const baseY = 600; // Bunden af grafen
  const barWidth = 100; // Bredden på søjlerne
  const maxHeight = 200; // Maksimal højde for søjler
  
  const TEST = sleepTotalMinutes? Math.round(sleepTotalMinutes) : 0;
  const sleepTotalHours = (Math.floor(TEST / 60));
const sleepRemainingMinutes = TEST % 60;
  const optimalSleepHours = 8; // Optimal søvn i timer
  const actualSleepHours = sleepTotalHours + sleepRemainingMinutes / 60; // Din søvn i timer
  //const acutalTotalSleepMinutes = actualSleepHours % 60;
  
// const sleepTotalMinutes = (stageTotals["Deep"] || 0) + (stageTotals["Core"] || 0) + (stageTotals["REM"] || 0);
//const sleepTotalHours = (Math.floor(sleepTotalMinutes / 60));
//const sleepRemainingMinutes = sleepTotalMinutes % 60;
 

  // Skaler søjlerne baseret på maksimal søvnlængde (8 timer)
  const optimalBarHeight = (optimalSleepHours / optimalSleepHours) * maxHeight;
  const actualBarHeight = (sleepTotalHours / optimalSleepHours) * maxHeight;

  // Optimal søvn søjle
  fill(125, 94, 255); // Lilla farve
  rect(baseX, baseY - optimalBarHeight, barWidth, optimalBarHeight, 10);
  fill(255);
  textSize(10);
  textAlign(CENTER, CENTER);
  text(`${optimalSleepHours} h`, baseX + barWidth / 2, baseY - optimalBarHeight+15);

  // Din søvn søjle
    fill(200);
  rect(baseX + 120, baseY- optimalBarHeight, barWidth, optimalBarHeight, 10);
  
  fill(13,97,242); // Blå farve
  rect(baseX + 120, baseY - actualBarHeight, barWidth, actualBarHeight, 10);
  fill(255);
  textAlign(CENTER, CENTER);
  
    if (sleepTotalHours>= 8 && sleepRemainingMinutes > 0) {
    text("8h+", baseX + 120 + barWidth / 2, baseY - actualBarHeight +15);

    }else{
      
     text(`${sleepTotalHours}h ${sleepRemainingMinutes} m `, baseX + 120 + barWidth / 2, baseY - actualBarHeight +15);
    }
  
  //Label for optimal
  textSize(12);
  textAlign(CENTER, CENTER);
  fill(125, 94, 255);
  rect(baseX, baseY + 10, barWidth,30,10 ); //cornerRadius = 10
  fill(255);
    text("Optimal", baseX, baseY + 10, barWidth,30);
  
  
    //Label for Your Sleep
  textSize(12);
  textAlign(CENTER,CENTER);
  fill(13,97,242);
  rect(baseX+120, baseY + 10, barWidth,30,10); //cornerRadius = 10
  fill(255);
  text("Your Sleep", baseX+120, baseY + 10, barWidth,30);
  

  // Hvis din søvn er mindre end optimal, tilføj tekst
  if (sleepTotalHours < 8 ) {
    fill(128);
    textAlign(CENTER, CENTER);
     text(
      "Din søvn er under den optimale søvn baseret for dig",
      baseX,
      baseY + 50,
      200,
      50
    );
  
}else {
    fill(128);
    textAlign(CENTER, CENTER);
    text(
      "Din søvn er over den optimale søvn baseret for dig",
      baseX,
      baseY + 50,
      200,
      50
    );
  }
}

function draw() {
  background(255);

  const padding = 30;
  const spacing = 5; // Afstand mellem rektanglerne
  const rectWidth = 102; // Bredde for hver faktaboks
  const rectHeight = 50; // Højde for hver faktaboks
  const cornerRadius = 10; // Radius for afrundede hjørner
  const totalColor = color(0, 164, 255); // Farve til faktaboksene

  textSize(12);
  textAlign(CENTER, CENTER);
  noStroke();
  
  
  fill(totalColor);
  rect(padding, padding, rectWidth, rectHeight, cornerRadius)

  // Faktaboks 1 - "Datoer"
  fill(totalColor);
  rect(padding, padding, rectWidth, rectHeight, cornerRadius);
  fill(255);
  text(days[selectedDayIndex].start.toLocaleString() ? days[selectedDayIndex].start.toLocaleDateString() : "N/A", padding + rectWidth / 2, padding + rectHeight / 2-10);
  text("-", padding + rectWidth / 2, padding + rectHeight / 2);
  text(days[selectedDayIndex].end.toLocaleString() ? days[selectedDayIndex].end.toLocaleDateString() : "N/A", padding + rectWidth / 2, padding + rectHeight / 2+10);
  
// Faktaboks 2 - "Go to bed"
fill(totalColor);
rect(padding + rectWidth + spacing, padding, rectWidth, rectHeight, cornerRadius);
fill(255);
text("Go to bed", padding + rectWidth + spacing + rectWidth / 2, padding + rectHeight / 2 - 7);

// Formatter "goToBed" til kun at vise timer og minutter
let goToBedTime = days[selectedDayIndex].goToBed 
                  ? days[selectedDayIndex].goToBed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                  : "N/A";
text(goToBedTime, padding + rectWidth + spacing + rectWidth / 2, padding + rectHeight / 2 + 10);

// Faktaboks 3 - "Wake up"
fill(totalColor);
rect(padding + 2 * (rectWidth + spacing), padding, rectWidth, rectHeight, cornerRadius);
fill(255);
text("Wake up", padding + 2 * (rectWidth + spacing) + rectWidth / 2, padding + rectHeight / 2 - 7);

// Formatter "wakeUp" til kun at vise timer og minutter
let wakeUpTime = days[selectedDayIndex].wakeUp 
                 ? days[selectedDayIndex].wakeUp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                 : "N/A";
text(wakeUpTime, padding + 2 * (rectWidth + spacing) + rectWidth / 2, padding + rectHeight / 2 + 10);


 // Tegn anden række af fire rektangler lige nedenunder med afrundede hjørner
  const secondRowY = padding + rectHeight + spacing; // Ny y-position for den anden række
  
  
  // Faktaboks 4 - "Total sleep"
  const totalSleepMinutes = Math.round(sleepDurations[selectedDayIndex] * 60);
  const totalSleepHours = Math.floor(totalSleepMinutes / 60);
  const totalSleepRemainingMinutes = totalSleepMinutes % 60;

  fill(totalColor);
 // rect(padding + 3 * (rectWidth + spacing), padding, rectWidth, rectHeight, cornerRadius);
  rect(padding, secondRowY, rectWidth, rectHeight, cornerRadius);
  fill(255);
  text("Total sleep", padding + rectWidth / 2, secondRowY + rectHeight / 2 - 7);
  text(`${totalSleepHours}h ${totalSleepRemainingMinutes}m`,padding + rectWidth / 2, secondRowY + rectHeight / 2 + 10);


// Faktaboks 5 - Awake i procent
  const awakePercentage = calculatePercentage("Awake"); // Beregn core/light sleep procentdel
   const formattedAwakePercentage = awakePercentage.toFixed(1);
  fill(totalColor);
  rect(padding + rectWidth + spacing, secondRowY, rectWidth, rectHeight, cornerRadius);
  fill(255);
  text("Awake", padding + ((rectWidth + spacing) * 1.5) - 3, secondRowY + rectHeight / 2 - 7);
  text(`${formattedAwakePercentage}%`, padding + ((rectWidth + spacing) * 1.5) - 3, secondRowY + rectHeight / 2 + 10);


 //Fakta boks 6 - sleep i procent
  /* const deepPercentage = calculatePercentage("Deep");// Beregn deep sleep procentdel
  const corePercentage = calculatePercentage("Core");
  const remPercentage = calculatePercentage("REM");*/
  const deepPercentage = parseFloat(calculatePercentage("Deep")); // Beregn deep sleep procentdel
  const corePercentage = parseFloat(calculatePercentage("Core"));
  const remPercentage = parseFloat(calculatePercentage("REM"));
  fill(totalColor);
  rect(padding + 2 * (rectWidth + spacing), secondRowY, rectWidth, rectHeight, cornerRadius);
  fill(255);
  text("Sleep", padding + 2 * (rectWidth + spacing) + rectWidth / 2, secondRowY + rectHeight / 2 - 7);
  const sleepPercentage = deepPercentage + corePercentage + remPercentage;
  // Afrund til én decimal
  const formattedSleepPercentage = sleepPercentage.toFixed(1);
  text(`${formattedSleepPercentage}%`, padding + 2 * (rectWidth + spacing) + rectWidth / 2, secondRowY + rectHeight / 2 + 10);

  // Opdater y-position for søvnstadie bjælker
  let chartYPosition = secondRowY + rectHeight + 30;

   // Diagram for total søvntid
  fill(totalColor);
  rect(padding, chartYPosition, 60, 30, cornerRadius);
  fill(255);
  text("Total", padding + 30, chartYPosition + 15);

  // Total søvntidsbaggrundsbjælke
  fill(200);
  rect(padding + 65, chartYPosition, 250, 30, cornerRadius);

  // Overlay bjælke for total søvntid
const maxSleepMinutes = 12 * 60; // Maksimum søvnvarighed, fx 12 timer
//const totalSleepBarWidth = (totalSleepMinutes / maxSleepMinutes) * 250; // Skaler total søvnvarighed til baggrundsbjælken
 const totalSleepBarWidth = 250; // Test fuld bredde

 // Skaleret bredde for total søvntid
  fill(totalColor);
  rect(padding + 65, chartYPosition, totalSleepBarWidth, 30, cornerRadius);
  fill(255);
   textSize(10);
  text(`${totalSleepHours}h ${totalSleepRemainingMinutes}m`, padding + 65 + totalSleepBarWidth / 2, chartYPosition + 15);
 textSize(12);
  chartYPosition += 50;
  
  
  // Søvnstadie bjælker (Awake, Sleep)
  const stages = ["Awake", "Sleep"];

// Beregn total "Sleep" minutter som summen af "Deep", "Core", og "REM"
const sleepTotalMinutes = (stageTotals["Deep"] || 0) + (stageTotals["Core"] || 0) + (stageTotals["REM"] || 0);


// Opdater stageTotals for at inkludere "Sleep" i stedet for de enkelte stadier
const updatedStageTotals = {
  Awake: stageTotals["Awake"] || 0,
  Sleep: sleepTotalMinutes
};

stages.forEach(stage => {
  const stageTotalMinutes = updatedStageTotals[stage] ? Math.round(updatedStageTotals[stage]) : 0;
  const stageHours = Math.floor(stageTotalMinutes / 60);
  const stageRemainingMinutes = stageTotalMinutes % 60;
  const stageBarWidth = (stageTotalMinutes / totalSleepMinutes) * 250;


  // Søvnstadie bjælker (Awake, Core, Deep, REM)
  //const stages = ["Awake", "Core", "Deep", "REM"];
 /* stages.forEach(stage => {
    const stageTotalMinutes = stageTotals[stage] ? Math.round(stageTotals[stage]) : 0;
    const stageHours = Math.floor(stageTotalMinutes / 60);
    const stageRemainingMinutes = stageTotalMinutes % 60;
    const stageBarWidth = (stageTotalMinutes / totalSleepMinutes) * 250;
*/
    // Label for stadie
    fill(stageColors[stage]);
    rect(padding, chartYPosition, 60, 30, cornerRadius);
    fill(255);
    text(stage, padding + 30, chartYPosition + 15);

    // Baggrundsbjælke for stadie
    fill(200);
    rect(padding + 65, chartYPosition, 250, 30, cornerRadius);

  
    //Overlay bjælker
    fill(stageColors[stage]);
    
    if(stageHours <= 0 && stageRemainingMinutes < 50 && stageRemainingMinutes >= 10){
      rect(padding + 65, chartYPosition, 30, 30, cornerRadius); //Hardcoder 30, anvendes også nede i teksten
      
    } else if(stageHours <= 0 && stageRemainingMinutes < 10){
      rect(padding + 65, chartYPosition, 20, 30, cornerRadius); //Hardcoder 30, anvendes også nede i teksten
    
    } else {
    
    rect(padding + 65, chartYPosition, stageBarWidth, 30, cornerRadius);
    }
    
    
    fill(255);
     textSize(10);
    if(stageHours <= 0){
      if(stageRemainingMinutes < 50 && stageRemainingMinutes >= 10){
          text(`${stageRemainingMinutes}m`, padding + 65 + 30 / 2, chartYPosition + 15); //Hardcoded 30, da denne bruges ovenfor hvor vi definere width for bjælken

      } else if(stageRemainingMinutes < 10){
        text(`${stageRemainingMinutes}m`, padding + 65 + 20 / 2, chartYPosition + 15); //Hardcoded 30, da denne bruges ovenfor hvor vi definere width for bjælken

      } else {
        text(`${stageRemainingMinutes}m`, padding + 65 + stageBarWidth / 2, chartYPosition + 15);
      }
      //text(`${stageHours}h ${stageRemainingMinutes}m`, padding + 65 + stageBarWidth / 2, chartYPosition + 15);
      //text(`${stageRemainingMinutes}m`, padding + 65 + 30 / 2, chartYPosition + 15); //Hardcoded 30, da denne bruges ovenfor hvor vi definere width for bjælken
      //text(`${stageRemainingMinutes}m`, padding + 65 + stageBarWidth / 2, chartYPosition + 15);
    } else {
      text(`${stageHours}h ${stageRemainingMinutes}m`, padding + 65 + stageBarWidth / 2, chartYPosition + 15);
    }
     textSize(12);
    chartYPosition += 50;
    
 
  });
  
  fill(0);
  textSize(14);
  textAlign(LEFT);
  text("How is your sleep compared to optimal sleep?", 35,310,300,50); //Hvordan er din søvn i forhold til optimal søvn?
  textSize(12);
  fill(128, 128, 128);
  text("Average optimal sleep for you based on your age is 8 hours" , 35,340,300,50);

  textSize(12);
  
  textAlign(CENTER);
  
 // Ny y-akse 
 let nyYAkse = 600; 
 
 drawVerticalBars(sleepTotalMinutes);
 
 
 
  
}
