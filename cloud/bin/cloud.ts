#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { FMSCalculatorProductionCloudStack } from '../lib/calculator-frontend-prod-infrastructure-stack';
import { FMSCalculatorStagingCloudStack } from '../lib/calculator-frontend-staging-infrastructure-stack';
import { Construct } from 'constructs';

interface FMSWebProps {
  environment: 'staging' | 'production'
}

class FMSCalculatorService extends Construct {
  constructor(scope: Construct, id: string, props: FMSWebProps) {
    super(scope, id);

    if (props.environment === 'staging') {
      new FMSCalculatorStagingCloudStack(this, 'WebAppStagingStack', {
        stackName: 'FMSCalculatorStagingInfrastructure',
        description: 'FMS Calculator Staging stack',
        env: {
          account: process.env.CDK_DEFAULT_ACCOUNT,
          region: 'eu-central-1'
        }
      });
    } else {
      // Production environment here
      new FMSCalculatorProductionCloudStack(this, 'WebAppProductionStack', {
        stackName: 'FMSCalculatorProductionInfrastructure',
        description: 'FMS Calculator Production Stack',
        env: {
          account: process.env.CDK_DEFAULT_ACCOUNT,
          region: 'eu-central-1'
        }
      });
    }
  }
}

const app = new App();
new FMSCalculatorService(app, 'FMSCalculatorWebApp', { environment: 'staging' });
// TODO - remove comment when production environment is ready
// new FMSCalculatorService(app, 'FMSCalculatorWebAppProduction', { environment: 'production' });

