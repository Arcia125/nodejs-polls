'use strict';

import Chart from 'chart.js';

require(`./main.scss`);

const createChart = (ctx) => {
  if (!ctx) {
    return;
  }
  const votes = JSON.parse(ctx.innerHTML);
  const voteNames = votes.map(vote => vote.name);
  const voteVotes = votes.map(vote => vote.votes);
  const myChart = new Chart(ctx, {
    type: `bar`,
    data: {
      labels: voteNames,
      datasets: [{
        label: 'Number of votes',
        data: voteVotes,
        backgroundColor: [
          `rgba(255, 99, 132, 0.6)`,
          `rgba(54, 162, 235, 0.6)`,
          `rgba(255, 206, 86, 0.6)`,
          `rgba(75, 192, 192, 0.6)`,
          `rgba(153, 102, 255, 0.6)`,
          `rgba(255, 159, 64, 0.6)`,
        ],
        borderColor: [
          `rgba(255,99,132,1)`,
          `rgba(54, 162, 235, 1)`,
          `rgba(255, 206, 86, 1)`,
          `rgba(75, 192, 192, 1)`,
          `rgba(153, 102, 255, 1)`,
          `rgba(255, 159, 64, 1)`,
        ],
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true
          }
        }]
      }
    }
  });
};

const initApp = function initApp() {
  const ctx = document.querySelector(`#vote-chart`);
  createChart(ctx);
  document.removeEventListener(`DOMContentLoaded`, initApp);
};

document.addEventListener(`DOMContentLoaded`, initApp);
