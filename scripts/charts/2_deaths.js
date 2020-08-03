(() => {

/***********************************************************************/
//Data
/***********************************************************************/
const totalDeathsMax = d3.max(deaths.map( ({ data }) => data.slice(-1)[0].total_deaths))
const paddedDeathsMax = totalDeathsMax * 1.2
let currData = deaths

/***********************************************************************/
//Plot Area
/***********************************************************************/
const cont = d3.select('#deaths-wrapper')

const height = 600
const width = 600
const margin = {
	left : 130,
	right : 70,
	bottom : 30,
	top : 30
}

const horizontalMargin = margin.right + margin.left
const verticalMargin = margin.bottom + margin.top

const plotAreaWidth = width - horizontalMargin
const plotAreaHeight = height - verticalMargin

const svg = cont
	.append('svg')
	//.attr('class', 'z-depth-5')
	.attr('width', width + horizontalMargin)
    .attr('height', height + verticalMargin)

const g = svg.append('g')
	.attr('class', 'transform-group')
 	.attr('transform', 'translate (' + margin.left + ',' + margin.top + ')')

/***********************************************************************/
//Scale
/***********************************************************************/
const xScale = d3.scaleLinear()
	.domain([0, paddedDeathsMax])
    .range([0, plotAreaWidth])   

let yScale = d3.scaleBand()
	.domain(deaths.map( ({ name }) => name).reverse())
	.range([0, plotAreaHeight])

/***********************************************************************/
//Axes
/***********************************************************************/
const xAxisG = g.append('g').classed('axis', true)
    .attr('id', 'xAxis')
    .attr('transform', 'translate(0,' + plotAreaHeight + ')')
    .style('font-size', '16px')

const yAxisG = g.append('g').classed('axis', true)
    .attr('id', 'yAxis')
    .style('font-size', '16px')

const xTicks = Math.round(plotAreaWidth / 100)

const tallyFormat = d => d === 0 ? "0" : d3.format(",")(d)

const xAxis = d3.axisBottom(xScale)
    .ticks(xTicks)
    .tickSize(-plotAreaHeight)
    .tickSizeOuter(0)
    .tickPadding(16)

let yAxis = d3.axisLeft(yScale)
	.ticks()
	.tickSizeOuter(0)

xAxisG.call(xAxis)
yAxisG.call(yAxis)

d3.select('#deaths-wrapper > #yAxis > .tick:first-of-type > line').remove()
d3.select('#deaths-wrapper > #yAxis > .tick:last-of-type > line').remove()

/***********************************************************************/
// Plotting
/***********************************************************************/
const gLabels = g.append('g').attr('class', 'g-label')

const plot = dataset => {

	dataset.forEach( ({ data, cc, name }, i) => {

		if (data.length) {
			const last = data.slice(-1)[0]
			if (d3.select(`#rect_${cc}`).empty()) {
				g.append('rect')
				    .attr('x', 1)
				    .attr('rx', 1)
				    .attr('y', yScale(name) + yScale.bandwidth() * 0.5 * 0.5)
				    .attr('width', 0)
				    .attr('height', yScale.bandwidth() * 0.5)
				    .attr('fill', colorDict[cc])
				    .attr('stroke', 'none')
				    .attr('opacity', '1.0')
				    .attr('stroke-linejoin', 'round')
				    .attr('stroke-linecap', 'round')
				    .attr('stroke-width', 2)
				    .attr('class', `deaths_rect`)
				    .attr('id', `rect_${cc}`)
				    .transition()
				    .duration(600)
				    	.attr('width', xScale(last.total_deaths))
				    	.on('end', () => {
				    		gLabels.append('text')
				    			.attr('class', 'num_label')
								.attr('id', 'deaths_label_' + cc)
								.attr('fill', 'black')
								.attr('x', xScale(last.total_deaths))
								.attr('y', yScale(name) + yScale.bandwidth() * 0.5)
								.attr('opacity', 0)
								.attr('dx', 15)
								.attr('dy', 1)
								.attr('alignment-baseline', 'middle')
								.text(tallyFormat(last.total_deaths))
								.transition()
								.duration(200)
								.attr('opacity', 1)
				    	})
			} else {

				d3.select(`#deaths_label_${cc}`)
					.transition()
					.duration(200)
					.attr('x', xScale(last.total_deaths))
					.attr('y', yScale(name) + yScale.bandwidth() * 0.5)
					.text(tallyFormat(last.total_deaths))

				d3.select(`#rect_${cc}`)
					.transition()
					.duration(600)
					.attr('y', yScale(name) + yScale.bandwidth() * 0.25)
					.attr('width', xScale(last.total_deaths))
			}
		}
	})
}

	plot(deaths)

	/***********************************************************************/
	//DOM
	/***********************************************************************/
	const dd = d3.select('#dropdown-month')
	const commaFormat = d => d3.format(",")(d)
	const fullDateFormat = d => d3.timeFormat("%b %y")(d)
	const parseDate = d => d3.timeParse("%b %y")(d)

	//Unique year-month pairs
	const yearMos = Array.from(new Set(deaths[0].data.map( ({ date }) => date.slice(0,7))))
		.sort(sortByDate)
		.map(date => fullDateFormat(new Date(date)))
		.slice(1)
		.reverse()
	
	yearMos.forEach((yearMo, i) => {
		dd.append('option')
			.attr('value', yearMo)
			.html(yearMo)
		})

	//Cleans up Y Axis ticks
	const yAxisDom = d3.select('#yAxis > .domain')
	const firstBarTopY = d3.select(`#rect_${deaths[0].cc}`).attr('x') * 13
	yAxisDom.attr('d', yAxisDom.attr('d').replace(/,(.*)V/g, `,13V`))

	//Events
	dd.on('change', function(d) {

		const { target } = d3.event
		const selectedMonth = parseDate(target.value).getMonth()

		const nextData = deaths.map(country => {
			let o = {...country}
			o.data = country.data.filter(({ date }) => {
				return (selectedMonth === new Date(date).getMonth())
			})
			return o
		})
		.sort( (a,b) => {

			if (!a.data.length || !b.data.length) {
				return 1
			}
			
			return (
				a.data[a.data.length - 1].total_deaths >
				b.data[b.data.length - 1].total_deaths ? 1 : -1
			)
		})

		yScale.domain(nextData.map( ({ name }) => name).reverse())

		yAxis = d3.axisLeft(yScale)
		.ticks()
		.tickSizeOuter(0)

		yAxisG.transition()
			.duration(600)
			.call(yAxis);
		//yAxisG.call(yAxis)
			
			plot(nextData)
		})
})()