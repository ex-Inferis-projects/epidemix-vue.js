const app = new Vue({
  el: '#app',
  data: {
    message: 'Loading',
    ctx: document.getElementById("chart").getContext("2d"),
    infected,
    infectivity,//according to data from China and Italy COVID-19 spreads at rate 22% a day
    numberOfDays,
    dayOfQarantine: 0,
    dayOfFaceMasks: 0,
    infectedRealNumberEstimation: 0,
    predictedMortalityRate: 0.06, //italy numbers
    totaldead,
    dead: 0,
    chart: undefined,
  },
  created: function () {
    this.uri = window.location.search.substring(1);
    this.params = new URLSearchParams(this.uri);
    this.message = 'Epidemix v.0.1 vue.js';
    this.infected = "10, 21, 32, 44, 61";
    this.infectivity = 0.22;//according to data from China and Italy COVID-19 spreads at rate 22% a day
    this.numberOfDays = this.params.get("days") != undefined ? this.params.get("days") : 14;
    this.predictedMortalityRate = this.params.get("mortality") != undefined ? this.params.get("mortality") : 0.06; //italy numbers
    this.dead = 0;
    this.totaldead = 0;
  },
  mounted: function () {
    this.drawchart();
  },

  methods: {
    predictedMortality(predictedInfected, predictedMortalityRate) {
      const pi = predictedInfected;
      const d = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];//14 days delay, people die 14 days later after hospitalized
      pi.forEach(inf => {
        d.push(Math.round(inf * (predictedMortalityRate / 10)));
      });

      this.totaldead = d.reduce((a, b) => a + b, 0);
      return d;
    },
    trueInfectivityModel(infected) { //counts true infectivity rate based on real data
      let arr = [];
      arr = this.copy(infected);
      const result = Math.round((arr.reduce((a, b) => a + b, 0) / arr.length)) / 100;
      return result;
    },
    labelGenerator(arr) {
      let result = [];
      for (let i = 1; i < arr.length - 4; i++) {
        result.push(`Day${i}`);
      }
      return result;
    },
    copy(array) {
      let arr = [];
      let json = JSON.stringify(array);
      arr = JSON.parse(json);
      let result = arr.split(',').map(Number);
      return result;
    },
    infectionModel(infected, infectionIndex, days, real) {
      let inf = [];
      inf = this.copy(infected);
      for (let day = 0; day < (days); day++) {
        let res = (inf[inf.length - 1] + inf[inf.length - 1] * infectionIndex)
        //lets forward this 14 days into the future with 22% increase
        inf.push( //TODO do a propper algorithm
          Math.round(day === 8 ? 0.79 * res :
            day === 9 ? 0.74 * res :
              day === 10 ? 0.73 * res :
                day >= 11 ? 0.65 * res : res)
        )
      }
      console.warn(inf)
      return inf;
    },
    drawchart: function () {
      //TODO fix this shitty url param binding
      this.params.set('days', this.numberOfDays);
      this.params.set('mortality', this.predictedMortalityRate);
      const predictedInfected = this.infectionModel(
        this.infected,
        this.infectivity,
        this.numberOfDays,
        'false'
      );
      const trueInfectivity = this.trueInfectivityModel(this.infected);
      const trueInfections = this.infectionModel(
        this.infected,
        trueInfectivity,
        this.numberOfDays,
        'false'
      );
      const predictedDead = this.predictedMortality(
        trueInfections,
        this.predictedMortalityRate,
      );
      const labels = this.labelGenerator(predictedInfected);

      //TODO this does not work at all
      const infectedRealNumberEstimation = this.infectionModel(
        this.infected,
        this.infectivity,
        this.numberOfDays,
        'true'
      );
      console.log(infectedRealNumberEstimation)
      //-------------------------------------------------------------------------------------------------------------
      // result = [21, 32, 39, 48, 59, 72, 88, 107, 131, 160, 195, 238, 290, 354, 432, 527]; on 14.March prediction
      //-------------------------------------------------------------------------------------------------------------

      const chartData = {
        labels: labels,
        datasets: [
          {
            label: [`Cases so far`],
            data: this.copy(this.infected),
            fill: true,
            backgroundColor: "green", //blue,
            borderColor: "blue"
          },
          {
            label: [`World average  infectivity : ${this.infectivity * 100}%`],
            data: predictedInfected,
            fill: false,
            backgroundColor: "gray", //blue,
            borderColor: "gray"
          },
          {
            label: [
              `Estimated dead based on mortality rate ${this.predictedMortalityRate * 100}%`
            ],
            fill: false,
            backgroundColor: "red",
            borderColor: "red",
            data: predictedDead
          },
          {
            label: [`Current average infectivity : ${trueInfectivity * 100}%`],
            data: trueInfections,
            fill: false,
            backgroundColor: "blue", //blue,
            borderColor: "blue"
          },
          {
            label: [`Real Infected `],
            data: infectedRealNumberEstimation,
            fill: false,
            backgroundColor: "black", //blue,
            borderColor: "black"
          },
        ]
      };

      if (
        this.chart !== undefined
        &&
        this.chart !== null
      ) {
        this.chart.destroy();
      }

      this.chart = new Chart(this.ctx, {
        type: "line",
        data: chartData,
        options: {
          layout: {
            padding: {
              left: 0,
              right: 0,
              top: 0,
              bottom: 10
            }
          }
        }
      });
    }
  }
});







//console.log(chart1)