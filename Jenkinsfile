#!groovy
pipeline {
  agent any

  // Global config
  environment {
    CI_SHA1="${env.GIT_COMMIT}"
    CI_BRANCH="${env.TAG_NAME!=null ? "" : env.BRANCH_NAME}"
    CI_BUILD_NUM="${env.BUILD_NUMBER}"
    CI_TAG="${env.TAG_NAME}"
    AWS_DEFAULT_REGION='us-east-1'
    KUBECONFIG_DATA='YXBpVmVyc2lvbjogdjEKY2x1c3RlcnM6Ci0gY2x1c3RlcjoKICAgIGNlcnRpZmljYXRlLWF1dGhvcml0eS1kYXRhOiBMUzB0TFMxQ1JVZEpUaUJEUlZKVVNVWkpRMEZVUlMwdExTMHRDazFKU1VNd2VrTkRRV0oxWjBGM1NVSkJaMGxOUm1RM1UwbFFPVmhyYzBJclNVa3pkMDFCTUVkRFUzRkhVMGxpTTBSUlJVSkRkMVZCVFVKVmVFVjZRVklLUW1kT1ZrSkJUVlJEYlhReFdXMVdlV0p0VmpCYVdFMTNTR2hqVGsxVWEzaE5ha0V6VFdwRk1FNVVWVFJYYUdOT1RXcHJlRTFxUVRKTmFrVXdUbFJWTkFwWGFrRldUVkpOZDBWUldVUldVVkZFUlhkd2NtUlhTbXhqYlRWc1pFZFdlazFKU1VKSmFrRk9RbWRyY1docmFVYzVkekJDUVZGRlJrRkJUME5CVVRoQkNrMUpTVUpEWjB0RFFWRkZRWFZ2VjFCYU1DOHZNSEZOSzJSNWR6SXhjRE5TU1RORlVtWnZXbGRvVEZKUFVIRTBZMkZ5UTBVclMwRmFTRGhrTDJSdFZqQUtNSFpwT1RkMWQyaGxiR2hoYkhCMVNIQmtabFZWUWxacFNFUXdkMlJYVm1OTU9YSXJWWHBOTTNSQ1duUmpha3hTZDJacGJubzJiVVZJWVROVE9WSkNhZ3BDVkdWdFJra3hVVEpzZVVkaFJIcEhTRzluS3lzMk9WbHVWV2wwVUhCMGJYaGlVbGtyT0Rod1ptWmxjSGRRSzFsd2N6UkJTbVYzYTBjclJuVm9jMjlKQ2paaFdXVlNNbEZUWlc1NWJIUk1LMUF3ZUhJMmNqSmhRbmxoWkU1Q1kwVXhVbmcxTnk4clRFcGtTREJGTDFSV2NYTkNlVEJqZFU1RVRqbE1kVk5wU0ZFS1ZHeGFlRmN5WjFKTVltSktNWFEzWm0wNVlrdG5UMDVVWjNOWGEzSklkbTVKWjBORlExbDZhMnBxT1VWeWRYQkdObGxEZEhKV1VuZEtTSFF5WlVOTWJ3cHRZM1ZsUmpZdlpXY3lUbGtyVGpWeWNsaDRUazFUVVVOWFkwazRUbnBGU0VoUlNVUkJVVUZDYjNsTmQwbFVRVTlDWjA1V1NGRTRRa0ZtT0VWQ1FVMURDa0ZSV1hkRWQxbEVWbEl3VkVGUlNDOUNRVlYzUVhkRlFpOTZRVTVDWjJ0eGFHdHBSemwzTUVKQlVYTkdRVUZQUTBGUlJVRmxjMGhMTWtOS1kyVm9lRGdLVEd0dFUzQlBRVzh3T1VoMWJXOXZOSEJtUlZWalducDRWU3M1VkVkM1dVMU9TMVpHTDJGTlMya3pNRVYxUzJSNU9FNU9SemhYZW5ReFZHeEtVUzlPZVFweVoydEZkakZYZDNwdFptbHlSbHBVY3pFMGNXRlZVRk53VDBwT2NYcEZla1JvUlV3M2RVeGtjRzlpWVcxMldFSTVaalJpVW05VFZHVnlWMjA1WkdwU0NtbFRha1pITW5aV1UzSkpSVWhsTVROTVpVcHRNRVZLVjA5bmFTdHNiM1puTTBsaGFqVTNla3BrVFdwaE9WcG1SMGxsT0ZKeVFsTk1WRzF6V2tOTmNITUtlWFp0V21kdVFXMU9VMWQyWm5WWlVpOVplWFpDYnpoMFlVNWlVR2RsUVVSVlNEZDBialpXT0hGcFFrODRNazVyUzJnMk1rWjFNWFk1VW5ObFQzRXpVd28yZVhaeFpsUldPR1ZpVFdGU1pXZEJTVzFrTVdWbVFUVmFObVJ2VFU5dE1YUXZkM0oxWWpod00wTlpMMlZSUjFsblNuRlROa0pLYUZGTlpFOHhObVp2Q25WTFJDdFJURkZIU0djOVBRb3RMUzB0TFVWT1JDQkRSVkpVU1VaSlEwRlVSUzB0TFMwdENnPT0KICAgIHNlcnZlcjogaHR0cHM6Ly9hcGkud29ya2luZy5rOHMucmFkaW8tZGV2LmNvbQogIG5hbWU6IHdvcmtpbmcuazhzLnJhZGlvLWRldi5jb20KLSBjbHVzdGVyOgogICAgY2VydGlmaWNhdGUtYXV0aG9yaXR5LWRhdGE6IExTMHRMUzFDUlVkSlRpQkRSVkpVU1VaSlEwRlVSUzB0TFMwdENrMUpTVU13ZWtORFFXSjFaMEYzU1VKQlowbE5SbVE1Y0hwT1UzWmpOa013U2s5T1ZFMUJNRWREVTNGSFUwbGlNMFJSUlVKRGQxVkJUVUpWZUVWNlFWSUtRbWRPVmtKQlRWUkRiWFF4V1cxV2VXSnRWakJhV0UxM1NHaGpUazFVYTNoTmFrRTFUV3BCZDA1VVNYcFhhR05PVFdwcmVFMXFRVFJOYWtGM1RsUkplZ3BYYWtGV1RWSk5kMFZSV1VSV1VWRkVSWGR3Y21SWFNteGpiVFZzWkVkV2VrMUpTVUpKYWtGT1FtZHJjV2hyYVVjNWR6QkNRVkZGUmtGQlQwTkJVVGhCQ2sxSlNVSkRaMHREUVZGRlFYaEVka2MzTjBsRE5uRk9WSFE1UmxSU1JGQlJTM1pKVkVzdmExUnFLMHRRYkhaUlIzQTNTVEUyYTB4clNrNUVSMjQyTTJvS01EaFJVVVEwV25KTVIyWmxVa3Q0ZVdSU01sTlpkakJoU0VoVk1FOHJNMEl3WldsU01YUkVVa0V2UzBodk1HWjBRVGxhT1drNFVucGhMM1FyUms1eWRRcEdTVWt6T0hrMlMxSlRObUpFVEd4TGIzaE1WMWREWjI4M2RYWlRWVFZEZGpWaFJ6UkhUSEp3TVc0MGRrTnpORlV5YjJKRFdEQlpUM3BJS3k4elRtTlhDbVJoV0VGVGQxQjBWRUZOTTBoUGFVMVpaV0o2Umk5ME1WbzFkR1kyTmtKM1IzZGlXVzkzZFc5VGFpOTZVRk5qUWk5UE1HZzRjbEp3TUZoV1NrNVVhRlVLVUhSM01YVTNZVTVMVkRCR1oyRnVZMmhZWVdoMGJtczBkVTFVY3k5cmFFNVNURVJHVHpodE5XZFhSa3hWV0dwaFJFVmpXVkZSV0cxQ1lYZDBMMVJTTlFwRGVtbGlPR2xPTTBJd2JEVm1UMlkwWVhsdmRrOW9SSGxVUVdjNEwzUlFSVFYzU1VSQlVVRkNiM2xOZDBsVVFVOUNaMDVXU0ZFNFFrRm1PRVZDUVUxRENrRlJXWGRFZDFsRVZsSXdWRUZSU0M5Q1FWVjNRWGRGUWk5NlFVNUNaMnR4YUd0cFJ6bDNNRUpCVVhOR1FVRlBRMEZSUlVGalVISTFXbTg1SzFwTFVYSUtjekJqVnpWWVQyeFBZWEJ5Ym5RNVptTTVVR3AyYVVWbU5WazVVQzlPVVhsaGJFNUJPVTlVZFhkaGNIQkpkRlF4Y1ZRNGFVeDROMWRtZUVGUmNYQktXUXBQWTJRellXVlFRMGhtVlVoWmVEZzVSRlptYkZsak0yZHJkMVpDVDBGSVJqTXdOR1ZDVXpkbFJVdzJhMXBqTDBKWk5Hb3hLMjg1VFdRek1uUlFUbkJrQ2taV2R6RmlRMDVtUzNndlIwaHhSakJwTWtaWEswUjNlR3hyVUZOelZ6VnVPV05aVG0wdk1GWTFVa3hLVUhobldUVjNkRUpVTm5sSWFHeFhNbmh0Y0cwS01UVTFZazVITjNveFNXVlhNREZRV25JeU1Xa3JZMFU1YVVkeGRqSTRjbGc0U2pGTGJrMWtlbGxsU1doYU1saEtXWEozUVRCWllTdEVWMllyTVU1NVN3cFNRWE4wZERGMFJrUlVRa1pUZEVkdlREQkxPRkF4VVhsM1dXNHhVazh3UW5aRGFuRnFXRkl2UldKc1RXcHhMMU5SYVVFd1ZucEVkV05MUjBzMWVHVm9Da2QzY1VKbFRUbHhZMmM5UFFvdExTMHRMVVZPUkNCRFJWSlVTVVpKUTBGVVJTMHRMUzB0Q2c9PQogICAgc2VydmVyOiBodHRwczovL2FwaS5wcm9kdWN0aW9uLms4cy5yYWRpby1wcmQuY29tCiAgbmFtZTogcHJvZHVjdGlvbi5rOHMucmFkaW8tcHJkLmNvbQpjb250ZXh0czoKLSBjb250ZXh0OgogICAgY2x1c3Rlcjogd29ya2luZy5rOHMucmFkaW8tZGV2LmNvbQogICAgdXNlcjogd29ya2luZ19rOHNfYWRtaW5zCiAgbmFtZTogd29ya2luZy5rOHMucmFkaW8tZGV2LmNvbQotIGNvbnRleHQ6CiAgICBjbHVzdGVyOiBwcm9kdWN0aW9uLms4cy5yYWRpby1wcmQuY29tCiAgICB1c2VyOiBhd3MKICBuYW1lOiBwcm9kdWN0aW9uLms4cy5yYWRpby1wcmQuY29tCmN1cnJlbnQtY29udGV4dDogd29ya2luZy5rOHMucmFkaW8tZGV2LmNvbQpraW5kOiBDb25maWcKcHJlZmVyZW5jZXM6IHt9CnVzZXJzOgotIG5hbWU6IHdvcmtpbmdfazhzX2FkbWlucwogIHVzZXI6CiAgICBleGVjOgogICAgICBhcGlWZXJzaW9uOiBjbGllbnQuYXV0aGVudGljYXRpb24uazhzLmlvL3YxYWxwaGExCiAgICAgIGFyZ3M6CiAgICAgIC0gZWtzCiAgICAgIC0gZ2V0LXRva2VuCiAgICAgIC0gLS1jbHVzdGVyLW5hbWUKICAgICAgLSB3b3JraW5nLms4cy5yYWRpby1kZXYuY29tCiAgICAgIC0gLS1yb2xlLWFybgogICAgICAtIGFybjphd3M6aWFtOjo0Nzc3Nzk5MTYxNDE6cm9sZS93b3JraW5nX2s4c19hZG1pbnMKICAgICAgY29tbWFuZDogYXdzCiAgICAgIGVudjogbnVsbAotIG5hbWU6IHByb2R1Y3Rpb25fazhzX2FkbWlucwogIHVzZXI6CiAgICBleGVjOgogICAgICBhcGlWZXJzaW9uOiBjbGllbnQuYXV0aGVudGljYXRpb24uazhzLmlvL3YxYWxwaGExCiAgICAgIGFyZ3M6CiAgICAgIC0gdG9rZW4KICAgICAgLSAtaQogICAgICAtIHByb2R1Y3Rpb24uazhzLnJhZGlvLXByZC5jb20KICAgICAgY29tbWFuZDogYXdzLWlhbS1hdXRoZW50aWNhdG9yCiAgICAgIGVudjogbnVsbA=='
  }

  stages {
    stage('Build') {
      environment {
        ROK8S_TMP = "/tmp"
        HELM_HOME = "${env.ROK8S_TMP}/.helm"
        HOME = "${env.ROK8S_TMP}"
      }
      agent {
        docker {
          label 'docker && !php'
          image 'quay.io/reactiveops/ci-images:v10-stretch'
          args '-u root -v /var/run/docker.sock:/var/run/docker.sock'
        }
      }
      steps {
        script {
          sh 'sudo git clean -xdf'
          def scmVars = checkout scm
          env.GIT_COMMIT = "${scmVars.GIT_COMMIT}"
          withCredentials ([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'dev']]) {
            switch (env.BRANCH_NAME) {
              case "develop":
              case ~/(.*\/)?feature-.*/: //Tmp for fairwinds testing
                env.ROK8S_CONFIG='deploy/development.config'
                env.BUILD_EXTRAARGS='--build-arg mode=none'
                ROK8S_CLUSTER='working.k8s.radio-dev.com'
                CRED_ID='dev'
                sh '''
                prepare-awscli;
                docker-pull -f deploy/build.config;
                ROK8S_DOCKER_BUILD_EXTRAARGS="$BUILD_EXTRAARGS";
                export ROK8S_DOCKER_BUILD_EXTRAARGS;
                docker-build -f deploy/build.config;
                docker-push -f deploy/build.config'''
                break

              case "staging":
                env.ROK8S_CONFIG='deploy/staging.config'
                env.BUILD_EXTRAARGS='--build-arg mode=none'
                ROK8S_CLUSTER='working.k8s.radio-dev.com'
                CRED_ID='dev'
                sh '''prepare-awscli;
                docker-pull -f deploy/build.config;
                ROK8S_DOCKER_BUILD_EXTRAARGS="$BUILD_EXTRAARGS";
                export ROK8S_DOCKER_BUILD_EXTRAARGS;
                docker-build -f deploy/build.config;
                docker-push -f deploy/build.config'''
                break

              case "preprod":
                env.ROK8S_CONFIG='deploy/pre-production.config'
                env.BUILD_EXTRAARGS='--build-arg mode=production --build-arg productionbuild=true'
                ROK8S_CLUSTER='working.k8s.radio-dev.com'
                CRED_ID='prd'
                sh '''#!/bin/bash -xe
                prepare-awscli;
                docker-pull -f deploy/build.config;
                ROK8S_DOCKER_BUILD_EXTRAARGS="$BUILD_EXTRAARGS";
                export ROK8S_DOCKER_BUILD_EXTRAARGS;
                docker-build -f deploy/build.config;
                docker-push -f deploy/build.config'''
                break

              case "master":
                env.ROK8S_CONFIG='deploy/production.config'
                env.BUILD_EXTRAARGS='--build-arg mode=production --build-arg productionbuild=true'
                ROK8S_CLUSTER='production.k8s.radio-prd.com'
                CRED_ID='prd'
                sh '''#!/bin/bash -xe
                prepare-awscli;
                docker-pull -f deploy/build.config;
                ROK8S_DOCKER_BUILD_EXTRAARGS="$BUILD_EXTRAARGS";
                export ROK8S_DOCKER_BUILD_EXTRAARGS;
                docker-build -f deploy/build.config;
                docker-push -f deploy/build.config'''
                break

              // case ~/ON-.*/:
              //   env.ROK8S_CONFIG='deploy/feature.config'
              //   break
            }
          }
        }
      }
    }

    stage('Test') {
      parallel {
        stage('Lint spa') {
          agent {
            docker {
              label 'docker && !php'
              image 'node:10.16.3'
              args '-u root' // Run as root to have write access to .config
            }
          }
          steps {
            sh 'cd spa && npm install && npm run lint -- --no-fix'
          }
        }

        stage('Lint app') {
          agent {
            docker {
              label 'docker && !php'
              image "477779916141.dkr.ecr.us-east-1.amazonaws.com/k8s-entercom/clay-radio:${env.GIT_COMMIT}"
              args '-u root' // Run as root to have write access to .config
            }
          }
          steps {
            sh 'cd /usr/src/app && npm run eslint'
          }
        }

        stage('Test Chart') {
          environment {
            ROK8S_TMP = "/tmp"
            HELM_HOME = "${env.ROK8S_TMP}/.helm"
            HOME = "${env.ROK8S_TMP}"
          }
          agent {
            docker {
              label 'docker && !php'
              image 'quay.io/reactiveops/ci-images:v10-stretch'
            }
          }
          steps {
            sh ''
            sh 'helm init --client-only'
            sh 'cd deploy/charts/clay-radio && helm dependency update && cd ../../..'
            sh 'helm lint ./deploy/charts/clay-radio/ --namespace example-working -f ./deploy/production/production.values.yml'
            sh 'helm template ./deploy/charts/clay-radio/ --namespace example-working -f ./deploy/production/production.values.yml > ${ROK8S_TMP}/out.yaml'
          }
        }
      }
    }

    stage('Deploy') {
      environment {
        ROK8S_TMP = "/tmp"
        HELM_HOME = "${env.ROK8S_TMP}/.helm"
        HOME = "${env.ROK8S_TMP}"
      }
      agent {
        docker {
          label 'docker && !php'
          image 'quay.io/reactiveops/ci-images:v10-stretch'
        }
      }

      when {
        expression {
          return env.BRANCH_NAME == 'master'|| env.BRANCH_NAME == 'staging' || env.BRANCH_NAME == 'develop' || env.BRANCH_NAME == 'preprod' || env.BRANCH_NAME ==~ /(.*\/)?feature-.*/
        }
      }

      steps {
        withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: "${CRED_ID}"]]) {
          sh 'prepare-kubectl'
          sh "kubectl config use-context ${ROK8S_CLUSTER}"
          sh 'helm-deploy -f ${ROK8S_CONFIG}'
        }
      }
    }
  }
}
