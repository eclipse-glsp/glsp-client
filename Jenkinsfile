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
    - mountPath: "/.yarn"
      name: "yarn-global"
      readOnly: false
  volumes:
  - name: "jenkins-home"
    emptyDir: {}
  - name: "yarn-global"
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
       
    environment {
        YARN_CACHE_FOLDER = "${env.WORKSPACE}/yarn-cache"
        SPAWN_WRAP_SHIM_ROOT = "${env.WORKSPACE}"
    }
    
    stages {
        stage('Build package') {
            steps {
                container('node') {
                    sh "yarn install"
                    sh "yarn test"
                }
            }
        }

        stage('Deploy (master only)') {
            when { branch 'master'}
            steps {
                build job: 'deploy-npm-glsp-client', wait: false
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

