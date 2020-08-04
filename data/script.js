const fs = require('fs')

const cases = JSON.parse(fs.readFileSync('./original/cases.json'))
const deaths = JSON.parse(fs.readFileSync('./original/deaths.json'))
const tests = JSON.parse(fs.readFileSync('./original/tests.json'))

const getCountryCodesByTop = ({ topN, dataset, cat }) => {

	const countryCodes = Object.keys(dataset)

	let flat = []

	countryCodes.forEach(cc => {
		if (cc != 'OWID_WRL') {
			flat.push({
				cc,
				[cat] : dataset[cc].data.slice(-1)[0][cat]
			})
		}
	})

	return flat.sort( (a,b) => a[cat] > b[cat] ? 1 : -1).slice(-topN)
}

const getSeriesByTop = ({ topN, dataset, cat, date }) => {

	const ccs = getCountryCodesByTop({ topN, dataset, cat })
	
	const series = ccs.map( ({ cc }) => {
		
		let o = {}

		o.cc = cc
		o.name = dataset[cc].location
		o.data = dataset[cc].data
			.filter(dp => dp.date >= date)
			.map(dp => ({ date : dp.date, [cat] : dp[cat] }))

		return o
	})
	return series
}

const writeSeries = (params) => {

	const series = getSeriesByTop(params)
	const { topN, cat, date } = params
	
	fs.writeFileSync(`top_${topN}_${cat}_from_${date}.json`, JSON.stringify(series))
}

const topCases = getSeriesByTop({
	topN : 10,
	dataset : tests,
	cat : 'total_cases',
	date : '2020-03-01'
})

topCases_TestData = topCases.map( ({ cc }) => tests[cc])
fs.writeFileSync(`top_10_cases_test_data_from_2020-03-01.json`, JSON.stringify(topCases_TestData))