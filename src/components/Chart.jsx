import PropTypes from 'prop-types'
import { useRef, useEffect } from 'react'
import Chart from 'chart.js/auto'
import 'chartjs-adapter-date-fns'

const ChartComponent = ({ data, colors }) => {
	const chartRef = useRef(null)
	const chartInstance = useRef(null)

	useEffect(() => {
		// Only create/update chart if we have data and a chart reference
		if (
			chartRef.current &&
			data.chartData &&
			data.chartData.temperature &&
			data.chartData.temperature.length > 0
		) {
			// Destroy existing chart if it exists
			if (chartInstance.current) {
				chartInstance.current.destroy()
			}

			// Create new chart
			chartInstance.current = new Chart(chartRef.current, {
				type: 'line',
				data: {
					datasets: [
						{
							label: 'Temperature (°C)',
							data: data.chartData.temperature,
							borderColor: colors?.temperature || '#FFB3BA', // pastel pink
							backgroundColor: `${colors?.temperature || '#FFB3BA'}33`, // transparent version
							borderWidth: 2, // Increased line thickness
							tension: 0.4, // Line smoothing
							fill: false,
							pointRadius: 5, // Make points more visible
						},
						{
							label: 'Humidity (%)',
							data: data.chartData.humidity,
							borderColor: colors?.humidity || '#B3E2CC', // pastel green
							backgroundColor: `${colors?.humidity || '#B3E2CC'}33`,
							borderWidth: 2, // Increased line thickness
							tension: 0.4, // Line smoothing
							fill: false,
							pointRadius: 5, // Make points more visible
						},
						{
							label: 'Pressure (hPa)',
							data: data.chartData.pressure,
							borderColor: colors?.pressure || '#FFDF8C', // pastel yellow
							backgroundColor: `${colors?.pressure || '#FFDF8C'}33`,
							borderWidth: 2, // Increased line thickness
							tension: 0.4, // Line smoothing
							fill: false,
							pointRadius: 5, // Make points more visible
						},
						{
							label: 'Gas (Ω)',
							data: data.chartData.gas,
							borderColor: colors?.gas || '#C6A3D1', // pastel purple
							backgroundColor: `${colors?.gas || '#C6A3D1'}33`,
							borderWidth: 2, // Increased line thickness
							tension: 0.4, // Line smoothing
							fill: false,
							pointRadius: 5, // Make points more visible
						},
					],
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					scales: {
						x: {
							type: 'time',
							time: {
								unit: 'minute', // Show the timestamps in minutes
								displayFormats: {
									second: 'HH:mm:ss',
									minute: 'HH:mm', // This format shows minute-based timestamps
								},
							},
							title: {
								display: true,
								text: 'Time',
							},
							ticks: {
								autoSkip: true, // Skip ticks to avoid clutter
								maxTicksLimit: 10, // Limit the number of ticks
							},
						},
						y: {
							title: {
								display: true,
								text: 'Value',
							},
							beginAtZero: false,
						},
					},
					plugins: {
						legend: {
							position: 'top',
						},
						tooltip: {
							mode: 'index',
							intersect: false,
						},
						zoom: {
							pan: {
								enabled: true,
								mode: 'x',
							},
							zoom: {
								wheel: {
									enabled: true,
								},
								pinch: {
									enabled: true,
								},
								mode: 'x',
							},
						},
					},
					interaction: {
						mode: 'nearest',
						axis: 'x',
						intersect: false,
					},
					animations: {
						radius: {
							duration: 400,
							easing: 'linear',
						},
					},
				},
			})
		}

		// Cleanup function to destroy chart when component unmounts
		return () => {
			if (chartInstance.current) {
				chartInstance.current.destroy()
			}
		}
	}, [data, colors]) // Re-render the chart if the data or colors change

	return (
		<div className='card chart-card'>
			<h2 className='card-header'>Sensor Readings / Time</h2>
			<div
				className='chart-container'
				style={{ height: '400px', position: 'relative' }}
			>
				<canvas ref={chartRef} />
			</div>
		</div>
	)
}

// Update PropTypes validation for the component props
ChartComponent.propTypes = {
	data: PropTypes.shape({
		temperature: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		humidity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		pressure: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		gas: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		chartData: PropTypes.shape({
			temperature: PropTypes.array,
			humidity: PropTypes.array,
			pressure: PropTypes.array,
			gas: PropTypes.array,
		}),
		stats: PropTypes.shape({
			temperature: PropTypes.object,
			humidity: PropTypes.object,
			pressure: PropTypes.object,
			gas: PropTypes.object,
		}),
	}).isRequired,
	colors: PropTypes.shape({
		temperature: PropTypes.string,
		humidity: PropTypes.string,
		pressure: PropTypes.string,
		gas: PropTypes.string,
	}),
}

// Default props
ChartComponent.defaultProps = {
	colors: {
		temperature: '#FFB3BA',
		humidity: '#B3E2CC',
		pressure: '#FFDF8C',
		gas: '#C6A3D1',
	},
}

export default ChartComponent
