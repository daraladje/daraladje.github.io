function scene3(title) {

	/***********************************************************************/
	//Dom
	/***********************************************************************/
	const cont = d3.select('#content-wrapper')
		.append('div')
		.attr('class', 'chart-wrapper')

	
	d3.select('.chart-title').html(title)

	const controls = d3.select('.chart-controls')
	
	controls.node().innerHTML = ''
	controls.append('span').html('Choose a country:  ')
	controls.append('select').attr('id', 'dropdown-country')

	/***********************************************************************/
	//Data
	/***********************************************************************/
	function getMaxPers({ data, tests }) {
		const perDiffCases = data.map( ({ perDiffCases }) => perDiffCases)
		const perDiffTests = tests.map( ({ perDiffTests }) => perDiffTests)
		const pers = perDiffTests.concat(perDiffCases).sort().filter(f => f)

		return (d3.max(pers))
	}

	const totalCasesMax = d3.max(cases.map( ({ data : { total_cases } }) => total_cases ))
	const paddedCasesMax = totalCasesMax * 1.2
	const begTime = new Date('2020-06-01')

	nextCases = cases.filter( ({ name }) => name != 'Brazil').map(ctry => {

		let _tests = tests
				.filter(ctryTest => ctryTest.location === ctry.name)[0]
				.data
				.filter( ({ date, total_tests }) => total_tests && begTime < new Date(date))

		_tests = _tests.map( (curr, i) =>  {
			curr.perDiffTests = i === 0 ? 0 : (curr.total_tests - _tests[0].total_tests) / _tests[0].total_tests * 100
			return curr
		})

		let nextData = ctry.data.filter( ({ date }) => begTime < new Date(date))

		const start = nextData[0]
		nextData.forEach( (curr, i) =>
			curr.perDiffCases = i === 0 ? 0 : (curr.total_cases - start.total_cases) / start.total_cases * 100
		)

		let o = { ...ctry }
		o.data = nextData
		o.tests = _tests
		return o
	})
	.reverse()

	/***********************************************************************/
	//Plot Area
	/***********************************************************************/

	const height = 400
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

	const countryChartTitle = cont.append('h4')
		.style('margin-left', margin.left + 'px')

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
	let yScale = d3.scaleLinear()
		.range([plotAreaHeight, 0])
		.domain([-1, getMaxPers(nextCases[0]) * 1.1])

	const xScale = d3.scaleTime()
		.range([0, plotAreaWidth])
		.domain([new Date('2020-05-31'), new Date('2020-08-02')])

	/***********************************************************************/
	//Axes
	/***********************************************************************/
	const xAxisG = g.append('g').classed('axis', true)
	    .attr('id', 'xAxis')
	    .attr('transform', 'translate(0,' + plotAreaHeight + ')')
	    .style('font-size', '10px')

	const yAxisG = g.append('g').classed('axis', true)
	    .attr('id', 'yAxis')
	    .style('font-size', '12px')

	const xTicks = Math.round(plotAreaWidth / 65)
	const yTicks = Math.round(plotAreaHeight / 65)

	const tallyFormat = d => d === 0 ? "0" : d3.format(".0")
	const commaFormat = d => d3.format(",")(d)
	const formatPercent = d => commaFormat(d) + '%'
	const dateFormat = d => d3.timeFormat("%b")(d)
	const fullDateFormat = d => d3.timeFormat("%b %e")(d)

	const xAxis = d3.axisBottom(xScale)
	    .ticks(xTicks)
	    .tickFormat(fullDateFormat)
	    .tickSize(0)
	    .tickSizeOuter(0)
	    .tickPadding(16)

	const yAxis = d3.axisLeft(yScale)
		.tickFormat(formatPercent)
		.ticks(yTicks)
	    .tickSize(0)
	    .tickSizeOuter(0)
	    .tickPadding(16)

	xAxisG.call(xAxis)
	yAxisG.call(yAxis)

	d3.select('#yAxis > .tick').attr('fill', '#bdbdbd')
	d3.select('#xAxis > .tick > line').remove()
	d3.select('#xAxis > .tick:last-of-type > line').remove()
	d3.select('#yAxis > .domain').remove()

	const plot = ({ data, name, tests, cc }) => {

		console.log(data, name, tests, cc)

		/***********************************************************************/
		// Plotting
		/***********************************************************************/

		const lastCase = data.splice(-1)[0]
		const lastTest = tests.splice(-1)[0]
		const gChart = g.append('g').attr('id', 'g-chart')
		const gLabels = gChart.append('g').attr('class', 'g-label')

		const line = d3.line()
			.curve(d3.curveCardinal.tension(0.5))
			.x(dp => xScale(new Date(dp.date)))
		    .y(dp => typeof(dp.perDiffTests) === 'number' ? yScale(dp.perDiffTests) : yScale(dp.perDiffCases))

		const casesPath = gChart.append('path')
		    .datum(data)
		    .attr('fill', 'none')
		    .attr('stroke', colorDict[cc])
		    .attr('opacity', '1.0')
		    .attr('stroke-linejoin', 'round')
		    .attr('stroke-linecap', 'round')
		    .attr('stroke-width', 2)
		    .attr('d', line)
		    .attr('class', `plot-line`)
		    .attr('id', `line_cases_${cc}`)
		    .attr('opacity', 0)

		let totalLength = casesPath.node().getTotalLength()

		casesPath
			.attr('stroke-dasharray', totalLength + " " + totalLength)
			.attr('stroke-dashoffset', totalLength)
			.transition()
			.duration(600)
			.attr('stroke-dashoffset', 0)
			.attr('opacity', 1)
			.on('end', () => {
				gLabels.append('text')
					.attr('class', 'cases-labels')
					.attr('x', dp => xScale(new Date(lastCase.date)))
					.attr('y', dp => yScale(lastCase.perDiffCases))
					.attr('dx', 5)
					.attr('dy', 5)
					.attr('font-size', '10px')
					.attr('fill', colorDict[cc])
					.attr('alignment-baseline', 'middle')
					.text( (lastCase.perDiffCases > 0 ? "+" : "-") + commaFormat(Math.round(lastCase.perDiffCases)) + '%' + ' cases')
					.attr('opacity', 0)
				    .transition()
					.duration(200)
					.attr('opacity', 1)
			})

		const testsPath = gChart.append('path')
		    .datum(tests)
		    .attr('fill', 'none')
		    .attr('stroke', colorDict[cc])
		    .attr('opacity', '1.0')
		    .attr('stroke-linejoin', 'round')
		    .attr('stroke-linecap', 'round')
		    .attr('stroke-dasharray', 4)
		    .attr('stroke-width', 2)
		    .attr('d', line)
		    .attr('class', `plot-line`)
		    .attr('id', `line_tests_${cc}`)
		    .attr('opacity', 0)

		testsPath
			.transition()
			.duration(600)
			.attr('opacity', 1)
			.on('end', () => {
				gLabels.append('text')
					.attr('class', 'tests-labels')
					.attr('x', dp => xScale(new Date(lastTest.date)))
					.attr('dx', 5)
					.attr('y', dp => yScale(lastTest.perDiffTests))
					.attr('font-size', '10px')
					.attr('fill', colorDict[cc])
					.attr('alignment-baseline', 'middle')
					.text( (lastTest.perDiffTests > 0 ? "+" : "-") + commaFormat(Math.round(lastTest.perDiffTests)) + '% ' + ' tests')
					.attr('opacity', 0)
				    .transition()
					.duration(200)
					.attr('opacity', 1)
			})
	}

	/***********************************************************************/
	//Interaction
	/***********************************************************************/
	let currData = Object.assign(nextCases[0], {})
	const dd = d3.select('#dropdown-country')

	const countryNames = nextCases.map( ({ name, cc }) => ({ name, cc }))
	
	countryNames.forEach( ({ name, cc }) => {
		dd.append('option')
			.attr('value', name)
			.html(name)
		})

	//Events
	dd.on('change', function(d) {
		
		const { target } = d3.event
		const selectedCountry = target.value
		const _nextDataSet = nextCases.filter( ({ name }) => name === selectedCountry)[0]
		const maxPer = getMaxPers(_nextDataSet)

		currData = {..._nextDataSet}

		yScale
			.domain([-1, maxPer])

		yAxisG.transition()
			.duration(600)
			.call(yAxis)

		d3.select('#g-chart')
			.transition()
			.duration(200)
			.attr('opacity', 0)
			.on('end', function() {
				d3.select(this).remove()
				plot(_nextDataSet)
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

		const { tests, data } = currData
		const mouseX = d3.mouse(this)[0]

		gGuides.selectAll('.guide-circle').remove()
		guideRect.attr('opacity', 1)
		guideRect.attr('d', `M${mouseX},0L${mouseX},${plotAreaHeight}`)

		tooltip.style('display', 'block')
			.style('position', 'absolute')
			.style('left', d3.event.pageX  + 15 + 'px')
			.style('top', d3.event.pageY * 0.5 + 'px')

		const x0 = xScale.invert(mouseX)

		const caseIdx = bisectDate(data, x0, 1)
		const testIdx = bisectDate(tests, x0, 1)
		const d0 = data[caseIdx - 1]
		const d1 = data[caseIdx]
		const d = x0 - d0.date > d1.date - x0 ? d1 : d0


		const table = d3.create('table')
		const header = table.append('tr')
		
		header.append('th').html('cases')
		header.append('th').html('tests')
		
		const dateTitle = d3.create('h2')
		dateTitle.html(fullDateFormat(new Date(data[caseIdx].date)))

		const row = table.append('tr')

		row.append('td').html('+' + commaFormat(Math.round(data[caseIdx].perDiffCases)) + '%')
		row.append('td').html(!tests[testIdx]
			? 'unavailable'
			: '+' + commaFormat(Math.round(tests[testIdx].perDiffTests)) + '%')

		tooltip.node().innerHTML = ''
		tooltip.node().appendChild(dateTitle.node())
		tooltip.node().appendChild(table.node())
	}

	plot(nextCases[0])
}

