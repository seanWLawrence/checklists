import { Construct } from "constructs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import { AWS_ALARM_EMAIL } from "./env";

export class AlertsConstruct extends Construct {
  public readonly alarmTopic: sns.Topic;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.alarmTopic = new sns.Topic(this, "alarm-topic", {
      displayName: "Infrastructure alarms",
    });

    this.alarmTopic.addSubscription(
      new subscriptions.EmailSubscription(AWS_ALARM_EMAIL),
    );
  }
}
