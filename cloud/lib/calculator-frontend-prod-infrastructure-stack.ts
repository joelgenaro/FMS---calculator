import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { CloudFrontWebDistribution, HttpVersion, OriginAccessIdentity, SecurityPolicyProtocol, SSLMethod, ViewerCertificate, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { ARecord, PublicHostedZone } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import { ParameterTier, StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class FMSCalculatorProductionCloudStack extends Stack {
  private bucketName = 'fms-calculator-v2';

  /**
   * TO DO
   */
  private hostedZoneId: string = '';
  private domainName: string = '';

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const productionBucket = new Bucket(this, 'ProductionWebBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      bucketName: this.bucketName,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html'
    });

    const zone = PublicHostedZone.fromHostedZoneAttributes(this, 'Calculator-Production-HostedZone', {
      hostedZoneId: this.hostedZoneId,
      zoneName: this.domainName
    });

    // TODO - generate certificate and input certificate ARN
    const certificate = Certificate.fromCertificateArn(this, 'Production-FMS-Certificate', '');

    const cloudFrontDistribution = new CloudFrontWebDistribution(this, 'CloudFrontProd', {
      enableIpV6: false,
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: productionBucket,
            originAccessIdentity: new OriginAccessIdentity(this, 'Prod-FMS-Calc-OAI')
          },
          behaviors: [
            {
              isDefaultBehavior: true,
              compress: true,
              minTtl: Duration.seconds(0),
              maxTtl: Duration.hours(24)
            }
          ]
        }
      ],
      httpVersion: HttpVersion.HTTP2,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      viewerCertificate: ViewerCertificate.fromAcmCertificate(certificate, {
        aliases: [this.domainName],
        securityPolicy: SecurityPolicyProtocol.TLS_V1_2_2021,
        sslMethod: SSLMethod.SNI
      }),
      errorConfigurations: [
        { errorCode: 403, responseCode: 200, responsePagePath: '/index.html' },
        { errorCode: 404, responseCode: 200, responsePagePath: '/index.html' }
      ]
    });

    new StringParameter(this, 'CFDistIdProd', {
      parameterName: '/Calculator/Prod/CloudFrontDistributionId',
      stringValue: cloudFrontDistribution.distributionId,
      tier: ParameterTier.STANDARD
    });

    const cloudFrontTarget = new CloudFrontTarget(cloudFrontDistribution);

    new ARecord(this, 'Calculator-Prod-Alias', {
      zone,
      target: {
        aliasTarget: cloudFrontTarget
      },
      recordName: this.domainName
    });
  }
}
