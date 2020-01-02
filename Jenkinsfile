#!groovy
pipeline {
  agent any

  // Global config
  environment{
    GO111MODULE='on'
    ROK8S_TMP = "${env.WORKSPACE}@tmp"
    HELM_HOME = "${env.ROK8S_TMP}/.helm"
    HOME = "${env.ROK8S_TMP}"
    CI_SHA1="${env.GIT_COMMIT}"
    CI_BRANCH="${env.GIT_BRANCH}"
    CI_BUILD_NUM="${env.BUILD_NUMBER}"
    CI_TAG="${env.BRANCH_NAME}"
    AWS_DEFAULT_REGION='us-east-1'
  }

  stages {
    stage('Checkout'){
      steps{
        script {
          // Defaults
          ROK8S_AWS_ACCOUNT_ID='477779916141'
          KUBECONFIG_S3_PATH='s3://entercom-working-infrastructure/working.k8s.radio-dev.com/config'
          ROK8S_CLUSTER='working.k8s.radio-dev.com'

          def scmVars = checkout scm
          env.GIT_COMMIT = "${scmVars.GIT_COMMIT}"

          switch (env.BRANCH_NAME) {
            case "develop" || "staging":
              env.ROK8S_CONFIG='deploy/working.config'
              break

            case "master":
              env.ROK8S_CONFIG='deploy/production.config'
              ROK8S_AWS_ACCOUNT_ID='477779916141' 
              KUBECONFIG_S3_PATH='s3://entercom-production-infrastructure/production.k8s.radio-prd.com/config'
              ROK8S_CLUSTER='production.k8s.radio-prd.com'
              break

            case ~/ON-.*/:
            case ~/(.*\/)?feature-.*/:
              env.ROK8S_CONFIG='deploy/feature.config'
              break
          }
        }
      }
    }

    stage('Test') {
        // branch ON-* 
      parallel {
        stage('Test Code') {
          agent {
            docker {
              image 'node:10.16.3'
            }
          }
          steps {
            // when does the git clone happen?
            // build setup
            sh 'mkdir -p build_directory'
            sh 'cd build_directory;
                echo "Build Clay & Compile Assets";
                make install'
            sh 'echo "Lint Clay App";
                cd app && npm run eslint'
            sh 'echo "Lint SPA";
                cd spa && npm run lint -- --no-fix'
            // build teardown 
          }
          // need to build in logic for default pipeline and custom pipeline 
        }

        stage('Test Chart') {
          agent {
            docker {
              image 'quay.io/reactiveops/ci-images:v10-stretch'
            }
          }
          steps {
            sh 'helm init --client-only'
            sh 'cd deploy/charts/clay-radio && helm dependency update && cd ../../..'
            sh 'helm lint ./deploy/charts/clay-radio/ --namespace example-staging -f ./deploy/staging/staging.values.yml'
            sh 'helm template ./deploy/charts/clay-radio/ --namespace example-staging -f ./deploy/staging/staging.values.yml > ${ROK8S_TMP}/out.yaml'
          }
        }
      }
    }

    stage('Build') {
      agent {
        docker {
          image 'quay.io/reactiveops/ci-images:v10-stretch'
          args '-u root -v /var/run/docker.sock:/var/run/docker.sock'
        }
      }

      when {
        expression {
          return env.BRANCH_NAME == 'master'|| env.BRANCH_NAME == 'staging' || env.BRANCH_NAME == 'develop'
        }
      }

      steps {
        withAWS(role: 'production_k8s_admins', externalId: '477779916141', duration: 900, roleSessionName: 'jenkins-session') {
          sh '''prepare-awscli;
            docker-pull -f deploy/build.config;
            docker-build -f deploy/build.config;
            docker-push -f deploy/build.config'''
        }
      }
    }

    stage('Deploy') {
      agent {
        docker {
          image 'quay.io/reactiveops/ci-images:v10-stretch'
        }
      }

      when {
        expression {
          return env.BRANCH_NAME == 'master'|| env.BRANCH_NAME == 'staging' || env.BRANCH_NAME == 'develop'
        }
      }

      steps {
        withAWS(role: 'production_k8s_admins', externalId: '477779916141', duration: 900, roleSessionName: 'jenkins-session') {
          sh "aws s3 cp ${KUBECONFIG_S3_PATH} ~/.kube/config"
          sh "kubectl config use-context ${ROK8S_CLUSTER}_k8s_admins"
          sh 'helm-deploy -f ${ROK8S_CONFIG}'
        }
      } 
    }
  }
}