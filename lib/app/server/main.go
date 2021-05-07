/*
 *
 * Copyright 2015 gRPC authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

// Package main implements a server for Identifier service.
package main

import (
	"context"
	"log"
	"net"
	"os"

	"github.com/buger/jsonparser"
	"github.com/go-resty/resty/v2"
	pb "github.com/otterley/grpc-demo/grpc-demo"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

const (
	port = ":50051"
)

// server is used to implement grpcDemo.IdentifierServer.
type server struct {
	pb.UnimplementedIdentifierServer
	taskID string
}

// GetTaskID implements grpcDemo.GetTaskID
func (s *server) GetTaskID(ctx context.Context, in *pb.GetTaskIDParams) (*pb.TaskID, error) {
	return &pb.TaskID{TaskID: s.taskID}, nil
}

func main() {
	client := resty.New()
	resp, err := client.R().Get(os.Getenv("ECS_CONTAINER_METADATA_URI_V4") + "/task")
	if err != nil {
		log.Fatalf("error retrieving task metadata: %v", err)
	}

	taskARN, err := jsonparser.GetString(resp.Body(), "TaskARN")
	if err != nil {
		log.Fatalf("while parsing JSON: %v", err)
	}

	lis, err := net.Listen("tcp", port)
	log.Printf("Listening on port %s\n", port)
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}
	s := grpc.NewServer()
	pb.RegisterIdentifierServer(s, &server{taskID: taskARN})
	reflection.Register(s)
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
