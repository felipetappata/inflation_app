// Curated registry of country CPI series on FRED.
//
// Series were chosen for cross-country comparability: the OECD "Main Economic
// Indicators" family (`<ISO3>CPIALLMINMEI`, Index 2015=100, monthly) is used
// wherever available. The US uses the canonical BLS series (CPIAUCSL), which is
// the longest and most current. Because every series is normalized to 1.0 at
// the user's chosen start date in the app, differing base years don't matter.
//
// When FRED_API_KEY is set, fetch-fred-data.mjs overrides title/units/source/
// frequency/seasonalAdjustment with exact values from the FRED API. Otherwise
// these registry values are used verbatim.

/** @typedef {{
 *  id: string, name: string, flag: string, seriesId: string,
 *  sourceAgency: string, fredTitle: string, units: string,
 *  frequency: string, seasonalAdjustment: string, color: string,
 *  defaultSelected?: boolean, note?: string
 * }} RegistryEntry */

const OECD = 'Organization for Economic Co-operation and Development';

/** @type {RegistryEntry[]} */
export const REGISTRY = [
	{
		id: 'usa',
		name: 'United States',
		flag: '🇺🇸',
		seriesId: 'CPIAUCSL',
		sourceAgency: 'U.S. Bureau of Labor Statistics',
		fredTitle: 'Consumer Price Index for All Urban Consumers: All Items in U.S. City Average',
		units: 'Index 1982-1984=100',
		frequency: 'Monthly',
		seasonalAdjustment: 'Seasonally Adjusted',
		color: '#4E79A7',
		defaultSelected: true
	},
	{
		id: 'gbr',
		name: 'United Kingdom',
		flag: '🇬🇧',
		seriesId: 'GBRCPIALLMINMEI',
		sourceAgency: OECD,
		fredTitle: 'Consumer Price Index of All Items in the United Kingdom',
		units: 'Index 2015=100',
		frequency: 'Monthly',
		seasonalAdjustment: 'Not Seasonally Adjusted',
		color: '#E15759',
		defaultSelected: true
	},
	{
		id: 'fra',
		name: 'France',
		flag: '🇫🇷',
		seriesId: 'FRACPIALLMINMEI',
		sourceAgency: OECD,
		fredTitle: 'Consumer Price Index of All Items in France',
		units: 'Index 2015=100',
		frequency: 'Monthly',
		seasonalAdjustment: 'Not Seasonally Adjusted',
		color: '#B07AA1',
		defaultSelected: false
	},
	{
		id: 'deu',
		name: 'Germany',
		flag: '🇩🇪',
		seriesId: 'DEUCPIALLMINMEI',
		sourceAgency: OECD,
		fredTitle: 'Consumer Price Index of All Items in Germany',
		units: 'Index 2015=100',
		frequency: 'Monthly',
		seasonalAdjustment: 'Not Seasonally Adjusted',
		color: '#76B7B2',
		defaultSelected: true
	},
	{
		id: 'arg',
		name: 'Argentina',
		flag: '🇦🇷',
		seriesId: 'ARGCPALTT01IXNBM',
		sourceAgency: OECD,
		fredTitle: 'Consumer Price Index: Total All Items for Argentina',
		units: 'Index 2015=100',
		frequency: 'Monthly',
		seasonalAdjustment: 'Not Seasonally Adjusted',
		color: '#59A14F',
		defaultSelected: false,
		note: 'FRED coverage begins Dec 2016; captures the recent high-inflation era.'
	},
	{
		id: 'ven',
		name: 'Venezuela',
		flag: '🇻🇪',
		seriesId: 'DDOE01VEA086NWDB',
		sourceAgency: 'World Bank',
		fredTitle: 'Consumer Price Index, All items for Venezuela',
		units: 'Index 2010=100',
		frequency: 'Annual',
		seasonalAdjustment: 'Not Seasonally Adjusted',
		color: '#EDC948',
		defaultSelected: false,
		note: 'FRED has only annual World Bank data through 2016; later hyperinflation is not covered.'
	},
	{
		id: 'jpn',
		name: 'Japan',
		flag: '🇯🇵',
		seriesId: 'JPNCPIALLMINMEI',
		sourceAgency: OECD,
		fredTitle: 'Consumer Price Index of All Items in Japan',
		units: 'Index 2015=100',
		frequency: 'Monthly',
		seasonalAdjustment: 'Not Seasonally Adjusted',
		color: '#FF9DA7',
		defaultSelected: false,
		note: 'FRED stopped updating this OECD series in June 2021.'
	},
	{
		id: 'bra',
		name: 'Brazil',
		flag: '🇧🇷',
		seriesId: 'BRACPIALLMINMEI',
		sourceAgency: OECD,
		fredTitle: 'Consumer Price Index of All Items in Brazil',
		units: 'Index 2015=100',
		frequency: 'Monthly',
		seasonalAdjustment: 'Not Seasonally Adjusted',
		color: '#9C755F',
		defaultSelected: false
	},
	{
		id: 'tur',
		name: 'Turkey',
		flag: '🇹🇷',
		seriesId: 'TURCPIALLMINMEI',
		sourceAgency: OECD,
		fredTitle: 'Consumer Price Index of All Items in Turkey',
		units: 'Index 2015=100',
		frequency: 'Monthly',
		seasonalAdjustment: 'Not Seasonally Adjusted',
		color: '#D37295',
		defaultSelected: false
	},
	{
		id: 'che',
		name: 'Switzerland',
		flag: '🇨🇭',
		seriesId: 'CHECPIALLMINMEI',
		sourceAgency: OECD,
		fredTitle: 'Consumer Price Index of All Items in Switzerland',
		units: 'Index 2015=100',
		frequency: 'Monthly',
		seasonalAdjustment: 'Not Seasonally Adjusted',
		color: '#BAB0AC',
		defaultSelected: false
	},
	{
		id: 'can',
		name: 'Canada',
		flag: '🇨🇦',
		seriesId: 'CANCPIALLMINMEI',
		sourceAgency: OECD,
		fredTitle: 'Consumer Price Index of All Items in Canada',
		units: 'Index 2015=100',
		frequency: 'Monthly',
		seasonalAdjustment: 'Not Seasonally Adjusted',
		color: '#86BCB6',
		defaultSelected: false
	},
	{
		id: 'mex',
		name: 'Mexico',
		flag: '🇲🇽',
		seriesId: 'MEXCPIALLMINMEI',
		sourceAgency: OECD,
		fredTitle: 'Consumer Price Index of All Items in Mexico',
		units: 'Index 2015=100',
		frequency: 'Monthly',
		seasonalAdjustment: 'Not Seasonally Adjusted',
		color: '#8CD17D',
		defaultSelected: false
	},
	{
		id: 'ita',
		name: 'Italy',
		flag: '🇮🇹',
		seriesId: 'ITACPIALLMINMEI',
		sourceAgency: OECD,
		fredTitle: 'Consumer Price Index of All Items in Italy',
		units: 'Index 2015=100',
		frequency: 'Monthly',
		seasonalAdjustment: 'Not Seasonally Adjusted',
		color: '#499894',
		defaultSelected: false
	},
	{
		id: 'esp',
		name: 'Spain',
		flag: '🇪🇸',
		seriesId: 'ESPCPIALLMINMEI',
		sourceAgency: OECD,
		fredTitle: 'Consumer Price Index of All Items in Spain',
		units: 'Index 2015=100',
		frequency: 'Monthly',
		seasonalAdjustment: 'Not Seasonally Adjusted',
		color: '#F1CE63',
		defaultSelected: false
	}
];
