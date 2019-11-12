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
            steps {
                container('node') {
                    sh "yarn install"
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
                    sh 'yarn publish:next'
                }
            }
        }
    }
}

