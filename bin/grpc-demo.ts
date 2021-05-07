#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { GrpcDemoStack } from '../lib/grpc-demo-stack';
import * as fs from 'fs';
import * as path from 'path';

const app = new cdk.App();
new GrpcDemoStack(app, 'GrpcDemoStack', {
  certificateARN: fs.readFileSync(path.join(__dirname, '..', 'certificate-arn.txt')).toString().trim(),
});
