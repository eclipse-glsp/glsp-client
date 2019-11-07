def kubernetes_config = """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: node
    image: node:10.17.0-alpine
    tty: true
    resources:
      limits:
        memory: "2Gi"
        cpu: "1"
      requests:
        memory: "2Gi"
        cpu: "1"
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
        stage('Run yarn install') {
            steps {
                container('node') {
                    sh "yarn  install"
                }
            }
        }
        stage('Deploy (master)') {
            when { branch 'master'}
            steps {
                sh 'echo "TODO deploy artifacts"'
            }
        }
    }
}
