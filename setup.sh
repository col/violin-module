#!/bin/bash
aws configure

DEVICE_NAME="violin-chip"

THING=`aws iot create-thing --thing-name "$DEVICE_NAME"`
THINGARN=`echo $THING | jq '.thingArn' | sed 's/\"//g'`
echo Created Thing $THINGARN

POLICY=`aws iot create-policy --policy-name "$DEVICE_NAME-policy" --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":"iot:*","Resource":"*"}]}'`
POLICYARN=`echo $POLICY | jq '.policyArn' | sed 's/\"//g'`
echo Created Policy $POLICYARN

mkdir ~/.aws-device

CERTIFICATE=`aws iot create-keys-and-certificate --set-as-active --certificate-pem-outfile ~/.aws-device/certificate.pem.crt --public-key-outfile ~/.aws-device/public.pem.key --private-key-outfile ~/.aws-device/private.pem.key`
CERTIFICATEARN=`echo $CERTIFICATE | jq '.certificateArn' | sed 's/\"//g'`
echo Created certificate $CERTIFICATEARN

aws iot attach-thing-principal --thing-name "$DEVICE_NAME" --principal $CERTIFICATEARN
aws iot attach-principal-policy --policy-name "$DEVICE_NAME-policy" --principal $CERTIFICATEARN
