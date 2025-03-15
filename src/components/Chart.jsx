import PropTypes from 'prop-types'
import { useRef, useEffect } from 'react'
import Chart from 'chart.js/auto'
import 'chartjs-adapter-date-fns'

const ChartComponent = ({ data }) => {
	const chartRef = useRef(null)
	const chartInstance = useRef(null)

	useEffect(() => {
		if (chartRef.current && data.chartData) {
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
							borderColor: '#FFB3BA', // pastel pink
							tension: 0.4,
						},
						{
							label: 'Humidity (%)',
							data: data.chartData.humidity,
							borderColor: '#B3E2CC', // pastel green
							tension: 0.4,
						},
						{
							label: 'Pressure (hPa)',
							data: data.chartData.pressure,
							borderColor: '#FFDF8C', // pastel yellow
							tension: 0.4,
						},
						{
							label: 'Gas (Ω)',
							data: data.chartData.gas,
							borderColor: '#C6A3D1', // pastel purple
							tension: 0.4,
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
								unit: 'second',
								displayFormats: {
									second: 'HH:mm:ss',
								},
							},
							title: {
								display: true,
								text: 'Time',
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
					},
				},
			})
		}

		return () => {
			if (chartInstance.current) {
				chartInstance.current.destroy()
			}
		}
	}, [data]) // Re-render the chart if the data changes

	return (
		<div
			className='chart-container'
			style={{ height: '400px', marginTop: '20px' }}
		>
			<h2>Sensor Readings / Time</h2>
			<canvas ref={chartRef} />
		</div>
	)
}

// Update PropTypes validation for the 'data' prop
ChartComponent.propTypes = {
	data: PropTypes.shape({
		temperature: PropTypes.string,
		humidity: PropTypes.string,
		pressure: PropTypes.string,
		gas: PropTypes.string,
		chartData: PropTypes.shape({
			temperature: PropTypes.array,
			humidity: PropTypes.array,
			pressure: PropTypes.array,
			gas: PropTypes.array,
		}),
		stats: PropTypes.shape({
			temperature: PropTypes.shape({
				max: PropTypes.string,
				min: PropTypes.string,
				avg: PropTypes.string,
			}),
			humidity: PropTypes.shape({
				max: PropTypes.string,
				min: PropTypes.string,
				avg: PropTypes.string,
			}),
			pressure: PropTypes.shape({
				max: PropTypes.string,
				min: PropTypes.string,
				avg: PropTypes.string,
			}),
			gas: PropTypes.shape({
				max: PropTypes.string,
				min: PropTypes.string,
				avg: PropTypes.string,
			}),
		}),
	}).isRequired,
}

export default ChartComponent
