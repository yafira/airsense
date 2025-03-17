import React, { useEffect, useRef, useState } from 'react'
import { Chart, registerables } from 'chart.js'
import 'chartjs-adapter-date-fns'
import '../styles/Chart.css'

// Register all Chart.js components
Chart.register(...registerables)

const ChartComponent = ({ data, colors }) => {
	const chartRef = useRef(null)
	const chartInstance = useRef(null)
	// Store accumulated data
	const historicalData = useRef({
		temperature: [],
		humidity: [],
		pressure: [],
		gas: [],
	})
	const [visibleDatasets, setVisibleDatasets] = useState({
		temperature: true,
		humidity: true,
		pressure: false,
		gas: false,
	})

	// Background color
	const backgroundColor = '#5F5F5F'
	const textColor = '#F8F8F8'

	// Function to prepare data in the correct format for Chart.js
	const prepareData = (rawData) => {
		if (!rawData || !Array.isArray(rawData)) return []

		// If data is array of numbers, convert to {x,y} format with timestamps
		if (typeof rawData[0] !== 'object') {
			const now = new Date().getTime()
			return rawData.map((value, index) => ({
				x: new Date(now - (rawData.length - 1 - index) * 1000),
				y: value,
			}))
		}

		// If data already has x,y format, ensure x is a Date object
		return rawData.map((point) => ({
			x: point.x instanceof Date ? point.x : new Date(point.x),
			y: point.y,
		}))
	}

	// Function to accumulate data
	const accumulateData = (newData) => {
		if (!newData || !newData.chartData) return

		const dataTypes = ['temperature', 'humidity', 'pressure', 'gas']
		const timestamp = new Date()

		dataTypes.forEach((type) => {
			if (newData.chartData[type] && Array.isArray(newData.chartData[type])) {
				// For simplicity, we'll assume the last value is the most recent one
				const latestValue =
					newData.chartData[type][newData.chartData[type].length - 1]
				const newPoint =
					typeof latestValue === 'object'
						? {
								x:
									latestValue.x instanceof Date
										? latestValue.x
										: new Date(latestValue.x),
								y: latestValue.y,
						  }
						: { x: timestamp, y: latestValue }

				// Add the new data point to historical data
				historicalData.current[type].push(newPoint)

				// Optional: limit the number of points to prevent performance issues
				if (historicalData.current[type].length > 100) {
					historicalData.current[type].shift()
				}
			}
		})
	}

	useEffect(() => {
		// Ensure we have valid data
		if (!data || !data.chartData) {
			console.error('Invalid chart data provided:', data)
			return
		}

		// Accumulate the new data
		accumulateData(data)

		// Function to create a new chart
		const createChart = () => {
			if (!chartRef.current) {
				console.error('Chart canvas reference is null')
				return
			}

			const ctx = chartRef.current.getContext('2d')
			if (!ctx) {
				console.error('Failed to get canvas context')
				return
			}

			// Fill canvas with background color before creating chart
			ctx.fillStyle = backgroundColor
			ctx.fillRect(0, 0, chartRef.current.width, chartRef.current.height)

			// Process data for each dataset
			const datasets = []
			const dataTypes = ['temperature', 'humidity', 'pressure', 'gas']
			const units = ['°C', '%', 'hPa', 'Ω']
			const axisPositions = ['left', 'right', 'right', 'right']

			dataTypes.forEach((type, index) => {
				// Use accumulated historical data instead of just current data
				if (historicalData.current[type].length > 0) {
					datasets.push({
						label: `${type.charAt(0).toUpperCase() + type.slice(1)} (${
							units[index]
						})`,
						data: historicalData.current[type],
						borderColor: colors[type],
						backgroundColor: `${colors[type]}30`,
						borderWidth: 3,
						pointRadius: 3,
						pointHoverRadius: 7,
						tension: 0.4,
						fill: true,
						yAxisID: `y-${type}`,
						hidden: !visibleDatasets[type],
					})
				}
			})

			console.log('Creating new chart with datasets:', datasets)

			// Create chart configuration
			const config = {
				type: 'line',
				data: { datasets },
				options: {
					responsive: true,
					maintainAspectRatio: false,
					animation: false,
					interaction: {
						mode: 'nearest',
						axis: 'x',
						intersect: false,
					},
					plugins: {
						title: {
							display: true,
							text: 'Sensor Readings Over Time',
							color: textColor,
							font: { size: 16, weight: 'bold' },
							padding: { top: 10, bottom: 20 },
						},
						legend: {
							position: 'top',
							labels: {
								usePointStyle: true,
								boxWidth: 10,
								padding: 15,
								color: textColor,
							},
						},
						tooltip: {
							backgroundColor: 'rgba(0, 0, 0, 0.8)',
							titleColor: textColor,
							bodyColor: textColor,
							padding: 10,
							titleFont: { size: 13 },
							bodyFont: { size: 12 },
							callbacks: {
								title: function (tooltipItems) {
									if (tooltipItems.length > 0) {
										const date = new Date(tooltipItems[0].parsed.x)
										return date.toLocaleTimeString([], {
											hour: '2-digit',
											minute: '2-digit',
											second: '2-digit',
											hour12: false,
										})
									}
									return ''
								},
							},
						},
					},
					scales: {
						x: {
							type: 'time',
							time: {
								unit: 'second',
								displayFormats: {
									second: 'HH:mm:ss',
									minute: 'HH:mm',
								},
							},
							title: {
								display: true,
								text: 'Time',
								color: textColor,
								font: { weight: 'bold' },
							},
							grid: {
								display: true,
								color: 'rgba(255, 255, 255, 0.1)',
							},
							ticks: {
								color: textColor,
								font: { size: 10 },
								maxRotation: 45,
								autoSkip: true,
							},
						},
					},
				},
			}

			// Configure Y-axes
			dataTypes.forEach((type, index) => {
				config.options.scales[`y-${type}`] = {
					type: 'linear',
					display: visibleDatasets[type],
					position: axisPositions[index],
					title: {
						display: true,
						text: `${type.charAt(0).toUpperCase() + type.slice(1)} (${
							units[index]
						})`,
						color: colors[type],
						font: { weight: 'bold' },
					},
					grid: {
						display: index === 0, // Only show grid for first axis
						color: 'rgba(255, 255, 255, 0.1)',
					},
					ticks: {
						color: colors[type],
						callback: function (value) {
							return `${value} ${units[index]}`
						},
					},
					beginAtZero: type === 'humidity',
					max: type === 'humidity' ? 100 : undefined,
				}
			})

			// Create the chart
			try {
				chartInstance.current = new Chart(ctx, config)
			} catch (error) {
				console.error('Error creating chart:', error)
			}
		}

		// Function to update existing chart with new data
		const updateChart = () => {
			if (!chartInstance.current) {
				console.error('Chart instance is null during update')
				return
			}

			const chart = chartInstance.current
			const dataTypes = ['temperature', 'humidity', 'pressure', 'gas']

			// Update each dataset with the accumulated historical data
			dataTypes.forEach((type, index) => {
				if (chart.data.datasets[index]) {
					chart.data.datasets[index].data = historicalData.current[type]
					chart.data.datasets[index].hidden = !visibleDatasets[type]
				}
			})

			// Update all axes visibility
			dataTypes.forEach((type) => {
				if (chart.options.scales[`y-${type}`]) {
					chart.options.scales[`y-${type}`].display = visibleDatasets[type]
				}
			})

			// Update the chart with animation disabled for smoother updates
			try {
				chart.update('none')
			} catch (error) {
				console.error('Error updating chart:', error)
			}
		}

		// Only create chart if it doesn't exist, otherwise update it
		if (!chartInstance.current) {
			createChart()
		} else {
			updateChart()
		}

		// Cleanup function to destroy chart when component unmounts
		return () => {
			if (chartInstance.current) {
				chartInstance.current.destroy()
				chartInstance.current = null
			}
		}
	}, [data, visibleDatasets]) // Removed colors from dependencies to prevent re-renders

	// Handle toggling visibility of datasets
	const toggleDataset = (datasetType) => {
		setVisibleDatasets((prev) => ({
			...prev,
			[datasetType]: !prev[datasetType],
		}))
	}

	return (
		<div className='chart-card' style={{ backgroundColor }}>
			<div
				className='chart-container'
				style={{ height: '400px', width: '100%' }}
			>
				<canvas ref={chartRef}></canvas>
			</div>
			<div className='dataset-toggles'>
				<button
					className={`toggle-btn ${
						visibleDatasets.temperature ? 'active' : ''
					}`}
					style={{
						backgroundColor: visibleDatasets.temperature
							? colors.temperature
							: '#333',
						color: textColor,
					}}
					onClick={() => toggleDataset('temperature')}
				>
					Temperature
				</button>
				<button
					className={`toggle-btn ${visibleDatasets.humidity ? 'active' : ''}`}
					style={{
						backgroundColor: visibleDatasets.humidity
							? colors.humidity
							: '#333',
						color: textColor,
					}}
					onClick={() => toggleDataset('humidity')}
				>
					Humidity
				</button>
				<button
					className={`toggle-btn ${visibleDatasets.pressure ? 'active' : ''}`}
					style={{
						backgroundColor: visibleDatasets.pressure
							? colors.pressure
							: '#333',
						color: textColor,
					}}
					onClick={() => toggleDataset('pressure')}
				>
					Pressure
				</button>
				<button
					className={`toggle-btn ${visibleDatasets.gas ? 'active' : ''}`}
					style={{
						backgroundColor: visibleDatasets.gas ? colors.gas : '#333',
						color: textColor,
					}}
					onClick={() => toggleDataset('gas')}
				>
					Gas
				</button>
			</div>
		</div>
	)
}

export default ChartComponent
