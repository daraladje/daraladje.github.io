/***********************************************************************/
//Data
/***********************************************************************/
const dateRange = [new Date('2020-03-01'), new Date('2020-08-02')];

/***********************************************************************/
//Helpers
/***********************************************************************/
const sortByDate = (a, b) => (new Date(a) > new Date(b) ? 1 : -1);

/***********************************************************************/
//Controller
/***********************************************************************/
const charts = [
  {
    title: 'Cases for the Top 10 Countries Over Time',
    copy:
      'COVID-19 has been devastating to the global population. It is an extremely contagious disease, as you can see in the chart to the right. From February to the present day, cases have increased dramatically. There are a lucky few countries that have been able to flatten the curve. The same cannot be said for the United States.',
    draw: scene1,
  },
  {
    title: 'Deaths for the Top 10 Countries by Month',
    copy:
      'Death does not occur to every person who has the disease; however, the numbers are still not pleasing. On the right, you can see month by month how the number of deaths has only increased, specifically for the US. The US has the highest number of COVID-19 deaths as well as the highest growth rate of deaths.',
    draw: scene2,
  },
  {
    title: 'Test & Case % Growth - June & July',
    copy:
      'Donald Trump claims that the high number of COVID-19 cases is directly related to the growth in testing. As you will see filtering through several countries, this is not the case. For countries that have flattened the curve and have experienced a high growth of testing, the COVID cases are not growing as fast.',
    draw: scene3,
  },
];

let transitionBetweenCharts = false;
let currSceneIdx = 0;

function drawNextScene(nextSceneIdx) {
  const pb = d3.select('#prev-button');
  const nb = d3.select('#next-button');

  if (nextSceneIdx === 0) pb.classed('disabled', true);
  else if (nextSceneIdx === charts.length - 1) nb.classed('disabled', true);
  else {
    nb.classed('disabled', false);
    pb.classed('disabled', false);
  }

  d3.select('.chart-copy').html(charts[nextSceneIdx].copy);

  const { title, copy, draw } = charts[nextSceneIdx];

  draw(title, copy);
  currSceneIdx = nextSceneIdx;
}

const transitionChart = (nextSceneIdx) => {
  const currChart = d3.select('.chart-wrapper');

  //tiddy up old scene
  if (!currChart.empty()) {
    currChart
      .transition()
      .duration(800)
      .style('opacity', 0)
      .on('end', function () {
        d3.select(this).remove();
        drawNextScene(nextSceneIdx);
      });
  } else {
    drawNextScene(nextSceneIdx);
  }
};

d3.select('#prev-button').on('click', function () {
  const but = d3.select(this);
  const nextScene = currSceneIdx - 1;
  transitionChart(nextScene);
});

d3.select('#next-button').on('click', function () {
  const but = d3.select(this);
  const nextScene = currSceneIdx + 1;
  transitionChart(nextScene);
});

transitionChart(0);
