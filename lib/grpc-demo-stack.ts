import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as path from 'path';
import * as acm from '@aws-cdk/aws-certificatemanager';

export interface GrpcDemoStackProps extends cdk.StackProps {
  certificateARN: string
}

export class GrpcDemoStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: GrpcDemoStackProps) {
    super(scope, id, props);

    const containerPort = 50051;
    const hostPort = containerPort;
    const listenerPort = 443;

    const vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: 2,
    });

    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc
    });

    const image = new ecs.AssetImage(path.join(__dirname, "app"));

    const taskDefinition = new ecs.TaskDefinition(this, 'TaskDefinition', {
      compatibility: ecs.Compatibility.EC2_AND_FARGATE,
      memoryMiB: "512",
      cpu: "256"
    });
    taskDefinition.addContainer('app', {
      image,
      memoryReservationMiB: 512,
      cpu: 256,
      portMappings: [{
        containerPort,
        hostPort,
      }],
      logging: ecs.LogDriver.awsLogs({streamPrefix: 'app'})
    });

    const service = new ecs.FargateService(this, 'Service', {
      cluster,
      taskDefinition,
      desiredCount: 6,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE,
      }
    });
    service.connections.allowFromAnyIpv4(ec2.Port.tcp(hostPort));

    const lb = new elbv2.ApplicationLoadBalancer(this, 'LoadBalancer', {
      vpc,
      internetFacing: true,
      http2Enabled: true
    });

    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc,
      protocol: elbv2.ApplicationProtocol.HTTP,
      protocolVersion: elbv2.ApplicationProtocolVersion.GRPC,
      port: hostPort,
      targetType: elbv2.TargetType.IP,
      targets: [service],
      deregistrationDelay: cdk.Duration.seconds(30),
    });
    lb.addListener('grpc', {
      port: listenerPort,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      defaultTargetGroups: [targetGroup],
      certificates: [
        elbv2.ListenerCertificate.fromArn(props.certificateARN)
      ]
    });
    lb.connections.allowFromAnyIpv4(ec2.Port.tcp(listenerPort));

    new cdk.CfnOutput(this, 'LoadBalancerEndpoint', {
      description: 'Load Balancer Endpoint',
      value: lb.loadBalancerDnsName,
    });
  }
}
