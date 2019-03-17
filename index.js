'use strict'

const AWS = require('aws-sdk')
const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const uuidv4 = require('uuid/v4')

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN
const SLACK_CHANNEL = process.env.SLACK_CHANNEL

async function getMetricsGraphFromCloudWatch(message) {
  const props = {
    width: 480,
    height: 240,
    start: '-PT3H',
    end: 'PT0H',
    timezone: '+0900',
    view: 'timeSeries',
    stacked: false,
    metrics: [
      [
        message.Trigger.Namespace,
        message.Trigger.MetricName,
        message.Trigger.Dimensions[0].name,
        message.Trigger.Dimensions[0].value
      ]
    ],
    stat:
      message.Trigger.Statistic.charAt(0).toUpperCase() +
      message.Trigger.Statistic.slice(1).toLowerCase(),
    period: message.Trigger.Period,
    annotations: {
      horizontal: [
        {
          color: '#ff6961',
          label: 'Trouble threshold start',
          value: 0
        }
      ]
    }
  }
  const widgetDefinition = {
    MetricWidget: JSON.stringify(props)
  }

  const cloudwatch = new AWS.CloudWatch()
  try {
    const response = await cloudwatch
      .getMetricWidgetImage(widgetDefinition)
      .promise()
    return response.MetricWidgetImage
  } catch (err) {
    console.error(err)
  }
}

async function sendSlackBot(records) {
  for (const record of records) {
    const sns = record.Sns
    const message = JSON.parse(sns.Message)

    let emoji = ':kissing:'
    if (message.NewStateValue == 'ALARM') {
      emoji = ':scream:'
    } else if (message.NewStateValue == 'OK') {
      emoji = ':grinning:'
    }

    const image = await getMetricsGraphFromCloudWatch(message)

    // to stream from buffer
    const file = '/tmp/' + uuidv4() + '-alarm.png'
    fs.writeFileSync(file, image)
    const streamImage = fs.createReadStream(file)

    const formData = new FormData()
    formData.append('token', SLACK_BOT_TOKEN)
    formData.append('filename', message.AlarmName + '.png')
    formData.append('file', streamImage)
    formData.append('filetype', 'png')
    formData.append('initial_comment', emoji + ' ' + sns.Subject + ', ' + message.NewStateReason)
    formData.append('channels', SLACK_CHANNEL)
    formData.append('title', sns.Subject)

    const response = await axios.create({
      headers: form.getHeaders()
    }).post('https://slack.com/api/files.upload', formData)
    console.log(response.data)
  }
}

exports.handler = async (event, context) => {
  // output event
  console.log(JSON.stringify(event))

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: "OK"
    })
  }

  try {
    await sendSlackBot(event.Records)
  } catch (err) {
    console.log(err)
    return err
  }

  return response
}
