import * as cdk from "@aws-cdk/core";
import * as sst from "@serverless-stack/resources";

export default class BdayStack extends sst.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Create the HTTP API
    const api = new sst.Api(this, "Api", {
      routes: {
        "GET            /": "src/index.handler", // returns 404 - OK
        "POST  /birthdays": "src/slashcommand.handler",  // returns list of birthdays
        "GET       /today": "src/slack.handler", // if birthday found sends Slack message
        "GET /date/{date}": "src/slack.handler", // if birthday found for given date ditto
        // "POST  /birthdays": "src/birthdays.add"  // TODO
      },
    });

    // Create a Cron job to ping each morning at 9h15 CEST
    new sst.Cron(this, "Cron", {
      schedule: "cron(15 7 ? * MON-SUN *)",
      job: {
        handler: "src/cronjob.handler",
    }
    });

    // Show API endpoint in output
    new cdk.CfnOutput(this, "ApiEndpoint", {
      value: api.httpApi.apiEndpoint,
    });
  }
}
