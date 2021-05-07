.PHONY: certificate
certificate: example.pem
	aws acm import-certificate --certificate fileb://example.pem --private-key fileb://example.key --query CertificateArn --output text | tee certificate-arn.txt

example.pem:
	openssl req -x509 -newkey rsa:2048 -nodes -keyout example.key -out example.pem \
	            -subj '/C=US/ST=Washington/L=Walla Walla/O=Acme/CN=example.com'