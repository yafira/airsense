import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import mqtt from 'mqtt'
import PropTypes from 'prop-types'
import '../styles/MQTT.css'

const MQTTClient = ({ onNewMessage }) => {
	// State for component
	const [client, setClient] = useState(null)
	const [connectionStatus, setConnectionStatus] = useState('disconnected')
	const [errorMessage, setErrorMessage] = useState('')
	const [messages, setMessages] = useState([])
	const [messageInput, setMessageInput] = useState('')
	const [isSubscribed, setIsSubscribed] = useState(false)
	const [publishTopic, setPublishTopic] = useState('airsense')
	const [subscriptionTopics, setSubscriptionTopics] = useState([
		'airsense',
		'airsense/#',
	])

	// MQTT configuration
	const brokerUrl = 'wss://tigoe.net/mqtt'

	// Memoize options to prevent reconnection on every render
	const options = useMemo(
		() => ({
			username: process.env.REACT_APP_MQTT_USERNAME,
			password: process.env.REACT_APP_MQTT_PASSWORD,
			clientId: 'mqttJsClient-' + Math.random().toString(16).substr(2, 8),
			clean: true,
			connectTimeout: 10000,
		}),
		[]
	) // Empty dependency array means this is created only once

	// Reference to maintain connection
	const clientRef = useRef(null)

	// Event handlers
	const handleConnect = useCallback(() => {
		console.log('Connected to MQTT broker')
		setConnectionStatus('connected')

		// Subscribe to multiple topics
		subscriptionTopics.forEach((topicToSubscribe) => {
			clientRef.current.subscribe(topicToSubscribe, (err) => {
				if (!err) {
					console.log(`Subscribed to topic: ${topicToSubscribe}`)
					setIsSubscribed(true)
				} else {
					console.error(`Subscription error for ${topicToSubscribe}:`, err)
					setErrorMessage(
						`Failed to subscribe to ${topicToSubscribe}: ${err.message}`
					)
				}
			})
		})

		// Send a test message
		setTimeout(() => {
			console.log('Publishing test message')
			clientRef.current.publish(
				publishTopic,
				JSON.stringify({
					test: true,
					time: new Date().toISOString(),
					message: 'Self-test from React client',
				})
			)
		}, 1000)
	}, [publishTopic, subscriptionTopics])

	const handleMessage = useCallback(
		(receivedTopic, payload) => {
			// Safely handle undefined payload
			if (!payload) {
				console.log(`Received undefined payload on ${receivedTopic}`)
				return
			}

			const message = payload.toString()
			console.log(`Received message on ${receivedTopic}:`, message)

			// Check if message is empty
			if (!message) {
				console.log(`Received empty message on ${receivedTopic}`)
				return
			}

			let isJson = true
			let parsedMessage = message

			try {
				parsedMessage = JSON.parse(message)
			} catch (e) {
				console.log(`Received non-JSON message on ${receivedTopic}: ${message}`)
				isJson = false
			}

			const newMessage = {
				topic: receivedTopic,
				payload: parsedMessage,
				isJson,
				time: new Date(),
				id: Date.now(),
			}

			setMessages((prevMessages) => {
				// Limit to 20 messages
				const updatedMessages = [newMessage, ...prevMessages].slice(0, 20)
				return updatedMessages
			})

			// Only process JSON messages
			if (isJson && parsedMessage) {
				// Pass the complete message to the parent component
				if (onNewMessage && typeof onNewMessage === 'function') {
					onNewMessage(newMessage)
				}
			}
		},
		[onNewMessage]
	)

	const handleError = useCallback((err) => {
		console.error('MQTT error:', err)
		setConnectionStatus('error')
		setErrorMessage(`Connection error: ${err.message}`)
	}, [])

	const handleClose = useCallback(() => {
		console.log('Connection closed')
		setConnectionStatus('disconnected')
		setIsSubscribed(false)
	}, [])

	const handleOffline = useCallback(() => {
		console.log('Client offline')
		setConnectionStatus('disconnected')
	}, [])

	const handleReconnect = useCallback(() => {
		console.log('Attempting to reconnect')
		setConnectionStatus('connecting')
	}, [])

	// Connect to MQTT broker
	const connectMQTT = useCallback(() => {
		setConnectionStatus('connecting')
		setErrorMessage('')

		try {
			console.log('Connecting to MQTT broker:', brokerUrl)
			const mqttClient = mqtt.connect(brokerUrl, options)
			clientRef.current = mqttClient
			setClient(mqttClient)

			// Set up event handlers
			mqttClient.on('connect', handleConnect)
			mqttClient.on('message', handleMessage)
			mqttClient.on('error', handleError)
			mqttClient.on('close', handleClose)
			mqttClient.on('offline', handleOffline)
			mqttClient.on('reconnect', handleReconnect)
		} catch (err) {
			console.error('Failed to create MQTT client:', err)
			setErrorMessage(`Failed to initialize MQTT client: ${err.message}`)
			setConnectionStatus('error')
		}
	}, [
		brokerUrl,
		options,
		handleConnect,
		handleMessage,
		handleError,
		handleClose,
		handleOffline,
		handleReconnect,
	])

	// Handle publishing messages
	const publishMessage = () => {
		if (!client || !isSubscribed || messageInput.trim() === '') return

		const payload = JSON.stringify({
			time: new Date().toISOString(),
			message: messageInput,
		})

		client.publish(publishTopic, payload, (err) => {
			if (err) {
				console.error('Publish error:', err)
				setErrorMessage(`Failed to publish: ${err.message}`)
			} else {
				console.log('Message published successfully')
				setMessageInput('')
			}
		})
	}

	// Add a new topic to subscribe to
	const addTopic = () => {
		if (messageInput.trim() === '') return

		const newTopic = messageInput.trim()
		if (!subscriptionTopics.includes(newTopic)) {
			setSubscriptionTopics((prev) => [...prev, newTopic])

			// Subscribe to the new topic if already connected
			if (clientRef.current && connectionStatus === 'connected') {
				clientRef.current.subscribe(newTopic, (err) => {
					if (!err) {
						console.log(`Subscribed to additional topic: ${newTopic}`)
					} else {
						console.error(`Subscription error for ${newTopic}:`, err)
						setErrorMessage(
							`Failed to subscribe to ${newTopic}: ${err.message}`
						)
					}
				})
			}

			setMessageInput('')
		}
	}

	// Connect when component mounts
	useEffect(() => {
		connectMQTT()

		// Clean up on unmount
		return () => {
			if (clientRef.current) {
				clientRef.current.end()
			}
		}
	}, [connectMQTT]) // Added connectMQTT to dependency array

	// Generate CSS class based on connection status
	const getStatusClass = () => {
		switch (connectionStatus) {
			case 'connected':
				return 'connected'
			case 'connecting':
				return 'reconnecting'
			case 'error':
				return 'error'
			default:
				return 'disconnected'
		}
	}

	return (
		<div className='mqtt-container'>
			<h2>MQTT Client</h2>

			<div className='connection-status'>
				<div className={`status-indicator ${getStatusClass()}`}></div>
				<span>Status: {connectionStatus}</span>
				{isSubscribed && (
					<div className='subscribed-topics'>
						<span>Subscribed to:</span>
						{subscriptionTopics.map((topic, index) => (
							<span key={index} className='subscribed-tag'>
								{topic}
							</span>
						))}
					</div>
				)}
			</div>

			{errorMessage && <div className='error-message'>{errorMessage}</div>}

			<div className='publish-settings'>
				<label htmlFor='publishTopic'>Publish Topic:</label>
				<input
					id='publishTopic'
					type='text'
					value={publishTopic}
					onChange={(e) => setPublishTopic(e.target.value)}
					placeholder='Publish topic'
					disabled={!isSubscribed}
				/>
			</div>

			<div className='message-input'>
				<input
					type='text'
					value={messageInput}
					onChange={(e) => setMessageInput(e.target.value)}
					placeholder='Enter message to publish or topic to subscribe'
					disabled={!isSubscribed}
				/>
				<button
					onClick={publishMessage}
					disabled={!isSubscribed || messageInput.trim() === ''}
				>
					Publish
				</button>
				<button
					onClick={addTopic}
					disabled={!isSubscribed || messageInput.trim() === ''}
				>
					Subscribe
				</button>
			</div>

			<div className='messages-container'>
				<h3>Received Messages</h3>
				{messages.length === 0 ? (
					<p className='no-messages'>No messages received yet</p>
				) : (
					<ul className='messages-list'>
						{messages.map((msg) => (
							<li key={msg.id} className='message-item'>
								<div className='message-header'>
									<span className='message-topic'>{msg.topic}</span>
									<span className='message-time'>
										{msg.time.toLocaleTimeString()}
									</span>
								</div>
								<pre className='message-content'>
									{msg.isJson
										? JSON.stringify(msg.payload, null, 2)
										: msg.payload}
								</pre>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	)
}

MQTTClient.propTypes = {
	onNewMessage: PropTypes.func,
}

export default MQTTClient
