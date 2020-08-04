function scene1(title) {
	
/***********************************************************************/
//Dom
/***********************************************************************/
const cont = d3.select('#content-wrapper')
	.append('div')
	.attr('class', 'chart-wrapper')

d3.select('.chart-title')
	.html(title)

	const controls = d3.select('.chart-controls')
	controls.node().innerHTML = ''


/***********************************************************************/
//Data
/***********************************************************************/
const totalCasesMax = d3.max(cases.map( ({ data : { total_cases } }) => total_cases ))
const paddedCasesMax = totalCasesMax * 1.2

/***********************************************************************/
//Plot Area
/***********************************************************************/


const height = 600
const width = 600
const margin = {
	left : 100,
	right : 60,
	bottom : 30,
	top : 30
}

const horizontalMargin = margin.right + margin.left
const verticalMargin = margin.bottom + margin.top

const plotAreaWidth = width - horizontalMargin
const plotAreaHeight = height - verticalMargin

const svg = cont
	.append('svg')
	.attr('width', width + horizontalMargin)
    .attr('height', height + verticalMargin)

const g = svg.append('g')
	.attr('class', 'transform-group')
 	.attr('transform', 'translate (' + margin.left + ',' + margin.top + ')')

/***********************************************************************/
//Scale
/***********************************************************************/
const xScale = d3.scaleTime()
	.rangeRound([0, plotAreaWidth])
	.domain(dateRange)

const yScale = d3.scaleLinear()
	.domain([0, 5000000])
    .range([plotAreaHeight, 0])    

/***********************************************************************/
//Axes
/***********************************************************************/
const xAxisG = g.append('g').classed('axis', true)
    .attr('id', 'xAxis')
    .attr('transform', 'translate(0,' + plotAreaHeight + ')')
    .style('font-size', '12px')

const yAxisG = g.append('g').classed('axis', true)
    .attr('id', 'yAxis')
    .style('font-size', '12px')

const xTicks = Math.round(plotAreaWidth / 100)
const yTicks = Math.round(plotAreaHeight / 100)

const tallyFormat = d => d === 0 ? "0" : d3.format(".0")(d / 1000000) + " Million"
const commaFormat = d => d3.format(",")(d)
const dateFormat = d => d3.timeFormat("%b")(d)
const fullDateFormat = d => d3.timeFormat("%B %d, %Y")(d)

const xAxis = d3.axisBottom(xScale)
    //.ticks(xTicks)
    .tickFormat(dateFormat)
    .tickSize(-plotAreaHeight)
    .tickSizeOuter(0)
    .tickPadding(16)

const yAxis = d3.axisLeft(yScale)
    .ticks(yTicks)
    .tickFormat(tallyFormat)
    .tickSize(-plotAreaWidth)
    .tickSizeOuter(0)
    .tickPadding(16)

xAxisG.call(xAxis)
yAxisG.call(yAxis)


d3.select('#xAxis > .tick:first-of-type > line').remove()
d3.select('#xAxis > .tick:last-of-type > line').remove()

/***********************************************************************/
// Plotting
/***********************************************************************/
const gLabels = g.append('g').attr('class', 'g-label')

const line = d3.line()
	.curve(d3.curveCardinal.tension(0.5))
	.x(dp => xScale(new Date(dp.date)))
    .y(dp => yScale(+dp.total_cases ? +dp.total_cases : 0))
    
cases.forEach( ({ data, cc, name }, i) => {
	
	const path = g.append('path')
	    .datum(data)
	    .attr('fill', 'none')
	    .attr('stroke', colorDict[cc])
	    .attr('stroke-linejoin', 'round')
	    .attr('stroke-linecap', 'round')
	    .attr('stroke-width', 2)
	    .attr('d', line)
	    .attr('class', `plotLine_${i}`)
	    .attr('id', `line_${cc}`)
	    .attr('opacity', 0)

	const totalLength = path.node().getTotalLength()

    path
		.attr('stroke-dasharray', totalLength + " " + totalLength)
		.attr('stroke-dashoffset', totalLength)
		.transition()
		.duration(600)
		.attr('stroke-dashoffset', 0)
		.attr('opacity', 1)
		.on('end', () => {

			const { date, total_cases } = data.slice(-1)[0]
			const x = xScale(new Date(date))
		    const y = yScale(+total_cases || 0)

			const label = gLabels.append('text')
				.attr('fill', colorDict[cc])
				.attr('x', x)
				.attr('y', y)
				.attr('dx', 15)
				.attr('opacity', 0)
				.attr('alignment-baseline', 'middle')
				.attr('dy', () => {

					switch (name) {

						case "South Africa" : {
							return -20 + 'px'
							break ;
						}

						case "Mexico" : {
							return -10 + 'px'
							break ;
						}

						case "Peru" : {
							return 5 + 'px'
							break ;
						}

						case "Chile" : {
							return 13 + 'px'
							break ;
						}

						case "Iran" : {
							return 20 + 'px'
							break ;
						}

						case "United Kingdom" : {
							return 35 + 'px'
							break ;
						}

						default : {
							return 0 + 'px'
						}

				}})
				.text(name)
				.attr('class', '')
				.attr('id', 'label_' + cc)
			
				const lx = +label.attr('x').replace('px', '') + +label.attr('dx').replace('px', '') - 1
				const ly = +label.attr('y').replace('px', '') + +label.attr('dy').replace('px', '')

				gLabels.append('path')
					.attr('d', `M ${x + 5} ${y} ${lx} ${ly}`)
					.attr('stroke', 'darkgrey')
					.attr('stroke-opacity', 0.8)
					.attr('stroke-dasharray', 1)

				label.transition()
					.duration(200)
					.attr('opacity', 1)
			})
		})

/***********************************************************************/
//Interaction
/***********************************************************************/
const gGuides = g.append('g')
	.attr('class', 'g-guides')

const guideRect = gGuides.append('path')
	.attr('stroke-width', 2)
	.attr('d', plotAreaHeight)
	.attr('x', 0)
	.attr('y', 0)
	.attr('stroke', '#bdbdbd')
	.attr('fill', 'none')
	.attr('stroke-dasharray', 4)

const tooltip = cont.append('div')
	.attr('class', 'tooltip')
	.attr('id', 'cases-tooltip')

const overlay = g.append('rect')
	.attr('x', 0)
	.attr('y', 0)
	.attr('width', plotAreaWidth)
	.attr('height', plotAreaHeight)
	.attr('fill', 'white')
	.attr('fill-opacity', 0)
	.on('mouseover', function() {
		guideRect.attr('opacity', 0)
		tooltip.style("display", null)
		gGuides.selectAll('.guide-circle').remove()
	})
	.on("mouseout mouseleave", function() {

		gGuides.selectAll('.guide-circle').remove()
		guideRect.attr('opacity', 0)
		tooltip.style("display", "none")
		tooltip.node().innerHTML = ''
	})
	.on("touchmove mousemove", mousemove)	
 
const bisectDate = d3.bisector(d => new Date(d.date)).left

function mousemove() {
	
	const mouseX = d3.mouse(this)[0]


	gGuides.selectAll('.guide-circle').remove()
	guideRect.attr('opacity', 1)
	guideRect.attr('d', `M${mouseX},0L${mouseX},${plotAreaHeight}`)

	tooltip.style('display', 'block')
		.style('position', 'absolute')
		.style('left', d3.event.pageX  + 15 + 'px')
		.style('top', d3.event.pageY * 0.5 + 'px')

	const table = d3.create('table')
	const header = table.append('tr')
	const x0 = xScale.invert(mouseX)

	header.append('th').html('legend')
	header.append('th').html('country')
	header.append('th').html('cases')

	const dateTitle = d3.create('h2')

	let rows = cases.map((country, i) => {

		const { data, name, cc } = country
		const idx = bisectDate(data, x0, 1)
		const d0 = data[idx - 1]
		const d1 = data[idx]
		const d = x0 - d0.date > d1.date - x0 ? d1 : d0

	   	if (i === 0) {
			dateTitle.html(fullDateFormat(new Date(d.date)))
		}
		return ({ cc, date : d.date, name, total_cases : +data[idx].total_cases ? +data[idx].total_cases : 0 })
	})
	.sort( (a,b) => a.total_cases < b.total_cases ? 1 : - 1)
	.forEach( ({ cc, date, name, total_cases }, i ) => {
		const fill = d3.select(`#label_${cc}`).attr('fill')
		const row = table.append('tr')

		row.append('td').html(`<span class='dot' style="background-color:${fill};"></span>`)
		row.append('td').html(name)
		row.append('td').html(commaFormat(total_cases))

		const r = 6
		gGuides.append('circle')
			.attr('r', r)
			.attr('fill', 'white')
			.attr('cx', xScale(new Date(date)) + r / 2)
			.attr('cy', yScale(total_cases))
			.attr('stroke', fill)
			.attr('stroke-width', 1)
			.attr('class', 'guide-circle')
	})

	tooltip.node().innerHTML = ''
	tooltip.node().appendChild(dateTitle.node())
	tooltip.node().appendChild(table.node())
}
}