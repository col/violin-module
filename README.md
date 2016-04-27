# Violin Module

Configure AWS Account

    aws configure

    Access Key ID: ...
    Secret Access Key: ...
    Region Name: ap-southeast-1

Create THING

    THING=`aws iot create-thing --thing-name "violin-chip"`
    THINGARN=`echo $THING | jq '.thingArn' | sed 's/\"//g'`
    echo Created Thing $THINGARN

Create Device Policy    

    POLICY=`aws iot create-policy --policy-name "violin-chip-policy" --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":"iot:*","Resource":"*"}]}'`
    POLICYARN=`echo $POLICY | jq '.policyArn' | sed 's/\"//g'`
    echo Created Policy $POLICYARN

Create Device Policy

    CERTIFICATE=`aws iot create-keys-and-certificate --set-as-active --certificate-pem-outfile certificate.pem.crt --public-key-outfile public.pem.key --private-key-outfile private.pem.key`
    CERTIFICATEARN=`echo $CERTIFICATE | jq '.certificateArn' | sed 's/\"//g'`
    echo Created certificate $CERTIFICATEARN

Attaching certificate and policy    

    aws iot attach-thing-principal --thing-name "violin-chip" --principal $CERTIFICATEARN
    aws iot attach-principal-policy --policy-name "violin-chip-policy" --principal $CERTIFICATEARN
