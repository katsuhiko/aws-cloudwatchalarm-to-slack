# cloudwatchalerm-to-slack

CloudWatch アラーム を Slack へ通知します。

参考
- [CloudWatchアラームとグラフを一緒にSlack通知する](https://qiita.com/hayao_k/items/026e704b5fad3037aea0)
- [CloudWatchAlarmをグラフ付きでSlackに通知する](https://tech.fusic.co.jp/cloud/cloudwatch-snapshot-graph-to-slack/)
- [CloudWatch Alarmでメール通知する際に一緒にグラフ画像を添付してみた](https://dev.classmethod.jp/cloud/aws/cloudwatch-snapshot-graph/)
- [AWS Cloudwatch Snapshot Graphs Alert Context](https://github.com/aws-samples/aws-cloudwatch-snapshot-graphs-alert-context)
- [Slack APIで画像ファイルをアップロードする](http://iyuichi.hatenablog.jp/entry/2016/06/14/195651)
- [slack api files.upload](https://api.slack.com/methods/files.upload)

## デプロイ方法

事前に Docker をインストールしてください。

コマンド実行時の重要な引数のみを説明します。

- install

    ```
    docker run -it -v $(pwd):/home/app -w /home/app node:8.12 npm install
    ```

- package

    | Argument | Example | Description |
    |---|---|---|
    | --s3-bucket | xxx-bucket-sam | ソース等（アーティファクト）をアップロードするバケット |

    ```
    aws cloudformation package --template-file template.yml --output-template-file serverless-output.yaml --s3-bucket xxx-bucket-sam
    ```

- deploy

    | Argument | Example | Description |
    |---|---|---|
    | SnsTopicName  | xxx-alerm-topic   | アラームを通知する SNS トピック名 |
    | SlackBotToken | xxx-999-999-xxx   | Slack Bot のトークン |
    | SlackChannel  | #notify_xxx_alerm | アラームを通知する Slack のチャンネル |

    ```
    aws cloudformation deploy --template-file serverless-output.yaml --stack-name cloudwatchalerm-to-slack --capabilities CAPABILITY_IAM --region ap-northeast-1 \
    --parameter-overrides "SnsTopicName=xxx-alerm-topic" "SlackBotToken=xxx-999-999-xxx" "SlackChannel=#notify_xxx_alerm"
    ```

## デプロイ後の作業

CloudWatch Alerm と結びつけます。
