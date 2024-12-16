import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { CloudFrontWebDistribution, HttpVersion, OriginAccessIdentity, PriceClass, ViewerCertificate, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import { ParameterTier, StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export class FMSCalculatorStagingCloudStack extends Stack {
  private bucketName = 'fms-calculator-staging-v2';

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const stagingBucket = new Bucket(this, 'StagingWebBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      bucketName: this.bucketName,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html'
    });

    const cloudFrontDistribution = new CloudFrontWebDistribution(this, 'CloudFrontStaging', {
      enableIpV6: false,
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: stagingBucket,
            originAccessIdentity: new OriginAccessIdentity(this, 'Staging-FMS-Calc-OAI')
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
      priceClass: PriceClass.PRICE_CLASS_100,
      viewerCertificate: ViewerCertificate.fromCloudFrontDefaultCertificate(),
      errorConfigurations: [
        { errorCode: 403, responseCode: 200, responsePagePath: '/index.html' },
        { errorCode: 404, responseCode: 200, responsePagePath: '/index.html' }
      ]
    });

    new StringParameter(this, 'CFDistIdStaging', {
      parameterName: '/Calculator/Staging/CloudFrontDistributionId',
      stringValue: cloudFrontDistribution.distributionId,
      tier: ParameterTier.STANDARD
    });
  }
}
