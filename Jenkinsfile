def kubernetes_config = """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: node
    image: node:10.17.0
    tty: true
    resources:
      limits:
        memory: "2Gi"
        cpu: "1"
      requests:
        memory: "2Gi"
        cpu: "1"
    command:
    - cat
    volumeMounts:
    - mountPath: "/home/jenkins"
      name: "jenkins-home"
      readOnly: false
  volumes:
  - name: "jenkins-home"
    emptyDir: {}
"""

pipeline {
    agent {
        kubernetes {
            label 'glsp-agent-pod'
            yaml kubernetes_config
        }
    }
    options {
        buildDiscarder logRotator(numToKeepStr: '15')
    }
    
    stages {
        stage('Build package') {
            environment {
                SPAWN_WRAP_SHIM_ROOT = "${env.WORKSPACE}"
                YARN_ARGS = "--cache-folder ${env.WORKSPACE}/yarn-cache --global-folder ${env.WORKSPACE}/yarn-global"
            }
            steps {
                container('node') {
                    sh "yarn ${env.YARN_ARGS} install"
                    sh "yarn ${env.YARN_ARGS} test"
                }
            }
        }

        stage('Deploy (master only)') {
            when { branch 'master'}
            steps {
                container('node') {
                    withCredentials([string(credentialsId: 'npmjs-token', variable: 'NPM_AUTH_TOKEN')]) {
                        sh 'printf "//registry.npmjs.org/:_authToken=${NPM_AUTH_TOKEN}\n" >> /home/jenkins/.npmrc'
                    }
                    sh 'git config  user.email "eclipse-glsp-bot@eclipse.org"'
                    sh 'git config  user.name "eclipse-glsp-bot"'
                    sh 'yarn publish:next'
                }
            }
        }
    }

    post {
        always {
            junit 'artifacts/test/xunit.xml'
        }
        success {
            archiveArtifacts 'artifacts/coverage/**'
        }
    }
}

