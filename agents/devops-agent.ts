import { BaseAgent } from './base-agent';
import fs from 'fs';
import path from 'path';

/**
 * DevOps Agent - Automatiza tareas de CI/CD e infraestructura
 * 
 * Este agente es responsable de:
 * 1. Generar configuraciones para CI/CD (GitHub Actions, Jenkins, etc.)
 * 2. Crear scripts de despliegue para diferentes plataformas
 * 3. Configurar entornos de desarrollo con Docker
 * 4. Optimizar pipelines de integración y despliegue
 * 5. Implementar infraestructura como código (Terraform, CloudFormation)
 */
export class DevOpsAgent extends BaseAgent {
  constructor() {
    super('DevOps Agent');
  }
  
  /**
   * Ejecuta el DevOps Agent para generar configuraciones y scripts
   * @param devopsSpec Especificación de la tarea de DevOps
   */
  async run(devopsSpec: string): Promise<void> {
    console.log(`🚀 DevOps Agent trabajando en: "${devopsSpec}"`);
    
    // Leer contexto relevante
    const coreContext = this.readContext('core.md');
    const rulesContext = this.readContext('rules.md');
    
    // Determinar el tipo de tarea DevOps
    const devopsType = this.determineDevOpsType(devopsSpec);
    
    // Analizar el código fuente o configuración existente si se proporciona una ruta
    let sourceCode = '';
    if (fs.existsSync(devopsSpec)) {
      try {
        sourceCode = fs.readFileSync(devopsSpec, 'utf-8');
      } catch (error) {
        console.warn(`⚠️ No se pudo leer el archivo: ${devopsSpec}`);
      }
    }
    
    // Crear prompt para el LLM
    const devopsPrompt = `
    # Contexto del Proyecto
    ${coreContext}
    
    # Reglas Arquitectónicas
    ${rulesContext}
    
    # Tarea de DevOps Agent
    Actúa como el DevOps Agent de CJ.DevMind. Tu tarea es generar configuraciones y scripts de DevOps basados en la siguiente especificación:
    
    "${devopsSpec}"
    
    Tipo de tarea: ${devopsType}
    
    ${sourceCode ? '# Código/Configuración Existente\n```\n' + sourceCode + '\n```\n' : ''}
    
    Genera:
    1. Configuración completa para ${this.getDevOpsTypeDescription(devopsType)}
    2. Documentación explicando la configuración y cómo utilizarla
    3. Scripts auxiliares necesarios para la implementación
    4. Recomendaciones de mejores prácticas para este tipo de configuración
    
    La configuración debe seguir las mejores prácticas de la industria y ser fácil de mantener y extender.
    `;
    
    // En modo real, consultaríamos al LLM
    let devopsConfig, devopsDocs, devopsScripts;
    
    if (process.env.DEVMIND_REAL_MODE === 'true') {
      try {
        const result = await this.queryLLM(devopsPrompt);
        
        // Extraer las diferentes partes de la respuesta
        devopsConfig = this.extractConfigFiles(result);
        devopsDocs = this.extractSection(result, 'Documentación');
        devopsScripts = this.extractScripts(result);
        
        // Guardar los archivos generados
        this.saveDevOpsFiles(devopsSpec, devopsType, devopsConfig, devopsDocs, devopsScripts);
      } catch (error) {
        console.error('❌ Error generando configuración DevOps:', error);
        return;
      }
    } else {
      // Modo simulado para desarrollo
      console.log('🧪 Ejecutando en modo simulado');
      
      // Generar archivos simulados
      devopsConfig = this.generateSimulatedDevOpsConfig(devopsType);
      devopsDocs = this.generateSimulatedDevOpsDocs(devopsType);
      devopsScripts = this.generateSimulatedDevOpsScripts(devopsType);
      
      // Guardar los archivos simulados
      this.saveDevOpsFiles(devopsSpec, devopsType, devopsConfig, devopsDocs, devopsScripts);
    }
    
    // Mostrar resultado
    console.log('\n✅ Configuración DevOps generada con éxito:');
    Object.keys(devopsConfig).forEach(file => {
      console.log(`- ${file}`);
    });
    console.log('- devops-documentation.md');
    Object.keys(devopsScripts).forEach(script => {
      console.log(`- ${script}`);
    });
  }
  
  /**
   * Determina el tipo de tarea DevOps basado en la especificación
   */
  private determineDevOpsType(devopsSpec: string): 'ci' | 'cd' | 'docker' | 'iac' | 'monitoring' {
    const ciKeywords = ['ci', 'integración continua', 'continuous integration', 'github actions', 'jenkins', 'gitlab ci', 'travis', 'build', 'compilación', 'test', 'prueba'];
    const cdKeywords = ['cd', 'despliegue continuo', 'continuous deployment', 'delivery', 'entrega', 'deploy', 'desplegar', 'release', 'publicar', 'kubernetes', 'k8s'];
    const dockerKeywords = ['docker', 'contenedor', 'container', 'dockerfile', 'docker-compose', 'imagen', 'image', 'virtualización', 'virtualization'];
    const iacKeywords = ['iac', 'infraestructura como código', 'infrastructure as code', 'terraform', 'cloudformation', 'pulumi', 'ansible', 'chef', 'puppet', 'provisioning'];
    const monitoringKeywords = ['monitoring', 'monitoreo', 'observabilidad', 'observability', 'prometheus', 'grafana', 'alertas', 'alerts', 'logs', 'métricas', 'metrics', 'dashboard'];
    
    const lowerSpec = devopsSpec.toLowerCase();
    
    // Contar ocurrencias de palabras clave
    const ciCount = ciKeywords.filter(keyword => lowerSpec.includes(keyword)).length;
    const cdCount = cdKeywords.filter(keyword => lowerSpec.includes(keyword)).length;
    const dockerCount = dockerKeywords.filter(keyword => lowerSpec.includes(keyword)).length;
    const iacCount = iacKeywords.filter(keyword => lowerSpec.includes(keyword)).length;
    const monitoringCount = monitoringKeywords.filter(keyword => lowerSpec.includes(keyword)).length;
    
    // Determinar el tipo basado en la mayor cantidad de palabras clave
    const counts = [
      { type: 'ci', count: ciCount },
      { type: 'cd', count: cdCount },
      { type: 'docker', count: dockerCount },
      { type: 'iac', count: iacCount },
      { type: 'monitoring', count: monitoringCount }
    ];
    
    counts.sort((a, b) => b.count - a.count);
    
    return counts[0].count > 0 ? counts[0].type as any : 'ci'; // Default a CI si no hay coincidencias claras
  }
  
  /**
   * Obtiene una descripción del tipo de tarea DevOps
   */
  private getDevOpsTypeDescription(devopsType: 'ci' | 'cd' | 'docker' | 'iac' | 'monitoring'): string {
    switch (devopsType) {
      case 'ci':
        return 'integración continua (CI)';
      case 'cd':
        return 'despliegue continuo (CD)';
      case 'docker':
        return 'contenedores Docker';
      case 'iac':
        return 'infraestructura como código (IaC)';
      case 'monitoring':
        return 'monitoreo y observabilidad';
      default:
        return 'DevOps';
    }
  }
  
  /**
   * Extrae una sección específica de la respuesta del LLM
   */
  private extractSection(text: string, sectionTitle: string): string {
    const regex = new RegExp(`## ${sectionTitle}([\\s\\S]*?)(?:## |$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }
  
  /**
   * Extrae archivos de configuración de la respuesta del LLM
   */
  private extractConfigFiles(text: string): Record<string, string> {
    const configFiles: Record<string, string> = {};
    
    // Buscar bloques de código con nombres de archivo
    const fileBlockRegex = /```(?:yaml|json|hcl|dockerfile|toml|ini)?\s*(?:Archivo: ([\w\-\.\/]+))?\s*\n([\s\S]*?)```/g;
    let match;
    
    while ((match = fileBlockRegex.exec(text)) !== null) {
      const fileName = match[1] || this.inferFileName(match[2]);
      if (fileName) {
        configFiles[fileName] = match[2].trim();
      }
    }
    
    return configFiles;
  }
  
  /**
   * Infiere el nombre del archivo basado en su contenido
   */
  private inferFileName(content: string): string {
    if (content.includes('name: ci') || content.includes('jobs:') || content.includes('on: [push')) {
      return '.github/workflows/ci.yml';
    } else if (content.includes('FROM ') && content.includes('WORKDIR ')) {
      return 'Dockerfile';
    } else if (content.includes('services:') && content.includes('image:')) {
      return 'docker-compose.yml';
    } else if (content.includes('provider "aws"') || content.includes('resource ')) {
      return 'main.tf';
    } else if (content.includes('apiVersion:') && content.includes('kind: Deployment')) {
      return 'deployment.yaml';
    } else {
      return 'config.yml';
    }
  }
  
  /**
   * Extrae scripts de la respuesta del LLM
   */
  private extractScripts(text: string): Record<string, string> {
    const scripts: Record<string, string> = {};
    
    // Buscar bloques de código con nombres de script
    const scriptBlockRegex = /```(?:bash|sh|powershell|ps1|bat|cmd)?\s*(?:Script: ([\w\-\.\/]+))?\s*\n([\s\S]*?)```/g;
    let match;
    
    while ((match = scriptBlockRegex.exec(text)) !== null) {
      const scriptName = match[1] || this.inferScriptName(match[2]);
      if (scriptName) {
        scripts[scriptName] = match[2].trim();
      }
    }
    
    return scripts;
  }
  
  /**
   * Infiere el nombre del script basado en su contenido
   */
  private inferScriptName(content: string): string {
    if (content.includes('docker build') || content.includes('docker-compose')) {
      return 'docker-build.sh';
    } else if (content.includes('terraform init') || content.includes('terraform apply')) {
      return 'deploy-infrastructure.sh';
    } else if (content.includes('kubectl') || content.includes('helm')) {
      return 'deploy-kubernetes.sh';
    } else if (content.includes('npm') || content.includes('yarn') || content.includes('build')) {
      return 'build.sh';
    } else if (content.includes('test') || content.includes('jest') || content.includes('pytest')) {
      return 'run-tests.sh';
    } else {
      return 'deploy.sh';
    }
  }
  
  /**
   * Guarda los archivos de configuración DevOps
   */
  private saveDevOpsFiles(
    devopsSpec: string,
    devopsType: 'ci' | 'cd' | 'docker' | 'iac' | 'monitoring',
    devopsConfig: Record<string, string>,
    devopsDocs: string,
    devopsScripts: Record<string, string>
  ): void {
    // Crear directorio si no existe
    const devopsDir = path.join(process.cwd(), 'devops');
    
    if (!fs.existsSync(devopsDir)) {
      fs.mkdirSync(devopsDir, { recursive: true });
    }
    
    // Guardar archivos de configuración
    for (const [fileName, content] of Object.entries(devopsConfig)) {
      const filePath = path.join(devopsDir, fileName);
      const fileDir = path.dirname(filePath);
      
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, content, 'utf-8');
    }
    
    // Guardar documentación
    fs.writeFileSync(
      path.join(devopsDir, 'devops-documentation.md'),
      `# Documentación DevOps: ${this.getDevOpsTypeDescription(devopsType)}\n\n${devopsDocs}`,
      'utf-8'
    );
    
    // Guardar scripts
    for (const [scriptName, content] of Object.entries(devopsScripts)) {
      const scriptPath = path.join(devopsDir, scriptName);
      fs.writeFileSync(scriptPath, content, 'utf-8');
      
      // Hacer ejecutables los scripts en sistemas Unix
      if (process.platform !== 'win32') {
        try {
          fs.chmodSync(scriptPath, '755');
        } catch (error) {
          console.warn(`⚠️ No se pudo hacer ejecutable el script: ${scriptName}`);
        }
      }
    }
  }
  
    /**
   * Genera configuraciones DevOps simuladas
   */
    private generateSimulatedDevOpsConfig(devopsType: 'ci' | 'cd' | 'docker' | 'iac' | 'monitoring'): Record<string, string> {
        const configs: Record<string, string> = {};
        
        if (devopsType === 'ci') {
          configs['.github/workflows/ci.yml'] = `name: CI
    
    on:
      push:
        branches: [ main, develop ]
      pull_request:
        branches: [ main, develop ]
    
    jobs:
      build:
        runs-on: ubuntu-latest
        
        strategy:
          matrix:
            node-version: [14.x, 16.x, 18.x]
        
        steps:
        - uses: actions/checkout@v3
        
        - name: Use Node.js ${{ matrix.node-version }}
          uses: actions/setup-node@v3
          with:
            node-version: ${{ matrix.node-version }}
            cache: 'npm'
        
        - name: Install dependencies
          run: npm ci
        
        - name: Lint
          run: npm run lint
        
        - name: Build
          run: npm run build
        
        - name: Test
          run: npm test
        
        - name: Upload coverage to Codecov
          uses: codecov/codecov-action@v3
          with:
            token: ${{ secrets.CODECOV_TOKEN }}
    `;
        } else if (devopsType === 'cd') {
          configs['.github/workflows/cd.yml'] = `name: CD
    
    on:
      push:
        branches: [ main ]
        tags: [ 'v*' ]
    
    jobs:
      deploy:
        runs-on: ubuntu-latest
        
        steps:
        - uses: actions/checkout@v3
        
        - name: Use Node.js 16.x
          uses: actions/setup-node@v3
          with:
            node-version: 16.x
            cache: 'npm'
        
        - name: Install dependencies
          run: npm ci
        
        - name: Build
          run: npm run build
        
        - name: Test
          run: npm test
        
        - name: Set up kubectl
          uses: azure/setup-kubectl@v3
        
        - name: Set up kubeconfig
          run: |
            mkdir -p ~/.kube
            echo "${{ secrets.KUBE_CONFIG }}" > ~/.kube/config
        
        - name: Deploy to Production
          if: startsWith(github.ref, 'refs/tags/v')
          run: |
            kubectl config use-context cj-devmind-prod
            kubectl apply -f kubernetes/deployment.yaml -n cj-devmind-production
            kubectl apply -f kubernetes/service.yaml -n cj-devmind-production
            kubectl rollout status deployment/cj-devmind -n cj-devmind-production
        
        - name: Deploy to Staging
          if: github.ref == 'refs/heads/main'
          run: |
            kubectl config use-context cj-devmind-staging
            kubectl apply -f kubernetes/deployment.yaml -n cj-devmind-staging
            kubectl apply -f kubernetes/service.yaml -n cj-devmind-staging
            kubectl rollout status deployment/cj-devmind -n cj-devmind-staging
    `;
    
          configs['kubernetes/deployment.yaml'] = `apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: cj-devmind
      labels:
        app: cj-devmind
    spec:
      replicas: 3
      selector:
        matchLabels:
          app: cj-devmind
      template:
        metadata:
          labels:
            app: cj-devmind
        spec:
          containers:
          - name: cj-devmind
            image: cj-devmind:latest
            ports:
            - containerPort: 3000
            resources:
              limits:
                cpu: "500m"
                memory: "512Mi"
              requests:
                cpu: "100m"
                memory: "256Mi"
            livenessProbe:
              httpGet:
                path: /health
                port: 3000
              initialDelaySeconds: 30
              periodSeconds: 10
            readinessProbe:
              httpGet:
                path: /ready
                port: 3000
              initialDelaySeconds: 5
              periodSeconds: 5
            env:
            - name: NODE_ENV
              value: "production"
    `;
    
          configs['kubernetes/service.yaml'] = `apiVersion: v1
    kind: Service
    metadata:
      name: cj-devmind
    spec:
      selector:
        app: cj-devmind
      ports:
      - port: 80
        targetPort: 3000
      type: ClusterIP
    `;
        } else if (devopsType === 'docker') {
          configs['Dockerfile'] = `FROM node:16-alpine AS builder
    
    WORKDIR /app
    
    COPY package*.json ./
    
    RUN npm ci
    
    COPY . .
    
    RUN npm run build
    
    FROM node:16-alpine
    
    WORKDIR /app
    
    COPY --from=builder /app/package*.json ./
    COPY --from=builder /app/dist ./dist
    
    RUN npm ci --only=production
    
    USER node
    
    EXPOSE 3000
    
    CMD ["node", "dist/index.js"]
    `;
    
          configs['docker-compose.yml'] = `version: '3.8'
    
    services:
      app:
        build: .
        ports:
          - "3000:3000"
        environment:
          - NODE_ENV=development
          - DATABASE_URL=postgres://postgres:postgres@db:5432/cjdevmind
        depends_on:
          - db
        restart: unless-stopped
        networks:
          - cjdevmind-network
    
      db:
        image: postgres:14-alpine
        environment:
          - POSTGRES_USER=postgres
          - POSTGRES_PASSWORD=postgres
          - POSTGRES_DB=cjdevmind
        volumes:
          - postgres-data:/var/lib/postgresql/data
        networks:
          - cjdevmind-network
    
    networks:
      cjdevmind-network:
        driver: bridge
    
    volumes:
      postgres-data:
    `;
        } else if (devopsType === 'iac') {
          configs['main.tf'] = `provider "aws" {
      region = var.aws_region
    }
    
    # VPC y subredes
    resource "aws_vpc" "main" {
      cidr_block = "10.0.0.0/16"
      
      tags = {
        Name        = "cj-devmind-vpc"
        Environment = var.environment
      }
    }
    
    resource "aws_subnet" "public" {
      count             = 3
      vpc_id            = aws_vpc.main.id
      cidr_block        = "10.0.${count.index}.0/24"
      availability_zone = data.aws_availability_zones.available.names[count.index]
      
      tags = {
        Name        = "cj-devmind-public-${count.index}"
        Environment = var.environment
      }
    }
    
    resource "aws_subnet" "private" {
      count             = 3
      vpc_id            = aws_vpc.main.id
      cidr_block        = "10.0.${count.index + 10}.0/24"
      availability_zone = data.aws_availability_zones.available.names[count.index]
      
      tags = {
        Name        = "cj-devmind-private-${count.index}"
        Environment = var.environment
      }
    }
    
    data "aws_availability_zones" "available" {}
    
    # ECR para imágenes Docker
    resource "aws_ecr_repository" "app" {
      name                 = "cj-devmind"
      image_tag_mutability = "MUTABLE"
      
      image_scanning_configuration {
        scan_on_push = true
      }
      
      tags = {
        Environment = var.environment
      }
    }
    
    # ECS Cluster
    resource "aws_ecs_cluster" "main" {
      name = "cj-devmind-cluster"
      
      setting {
        name  = "containerInsights"
        value = "enabled"
      }
      
      tags = {
        Environment = var.environment
      }
    }
    
    # ECS Task Definition
    resource "aws_ecs_task_definition" "app" {
      family                   = "cj-devmind"
      network_mode             = "awsvpc"
      requires_compatibilities = ["FARGATE"]
      cpu                      = "256"
      memory                   = "512"
      execution_role_arn       = aws_iam_role.ecs_execution_role.arn
      
      container_definitions = jsonencode([
        {
          name      = "cj-devmind"
          image     = "${aws_ecr_repository.app.repository_url}:latest"
          essential = true
          
          portMappings = [
            {
              containerPort = 3000
              hostPort      = 3000
            }
          ]
          
          environment = [
            {
              name  = "NODE_ENV"
              value = var.environment
            }
          ]
          
          logConfiguration = {
            logDriver = "awslogs"
            options = {
              awslogs-group         = "/ecs/cj-devmind"
              awslogs-region        = var.aws_region
              awslogs-stream-prefix = "ecs"
            }
          }
        }
      ])
    }
    
    resource "aws_iam_role" "ecs_execution_role" {
      name = "cj-devmind-ecs-execution-role"
      
      assume_role_policy = jsonencode({
        Version = "2012-10-17"
        Statement = [
          {
            Action = "sts:AssumeRole"
            Effect = "Allow"
            Principal = {
              Service = "ecs-tasks.amazonaws.com"
            }
          }
        ]
      })
    }
    
    resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
      role       = aws_iam_role.ecs_execution_role.name
      policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
    }`;
    
          configs['variables.tf'] = `variable "aws_region" {
      description = "AWS region to deploy resources"
      type        = string
      default     = "us-west-2"
    }
    
    variable "environment" {
      description = "Environment (dev, staging, prod)"
      type        = string
      default     = "dev"
    }`;
        } else if (devopsType === 'monitoring') {
          configs['prometheus/prometheus.yml'] = `global:
      scrape_interval: 15s
      evaluation_interval: 15s
    
    alerting:
      alertmanagers:
        - static_configs:
            - targets:
                - alertmanager:9093
    
    rule_files:
      - "alert_rules.yml"
    
    scrape_configs:
      - job_name: "prometheus"
        static_configs:
          - targets: ["localhost:9090"]
    
      - job_name: "node_exporter"
        static_configs:
          - targets: ["node-exporter:9100"]
    
      - job_name: "app"
        metrics_path: /metrics
        static_configs:
          - targets: ["app:3000"]`;
    
          configs['prometheus/alert_rules.yml'] = `groups:
    - name: cj-devmind-alerts
      rules:
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage (instance {{ $labels.instance }})"
          description: "CPU usage is above 80% for 5 minutes\\n  VALUE = {{ $value }}\\n  LABELS: {{ $labels }}"
    
      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage (instance {{ $labels.instance }})"
          description: "Memory usage is above 80% for 5 minutes\\n  VALUE = {{ $value }}\\n  LABELS: {{ $labels }}"
    
      - alert: HighAPILatency
        expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route)) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High API latency (route {{ $labels.route }})"
          description: "95th percentile of HTTP request duration is above 1 second for 5 minutes\\n  VALUE = {{ $value }}\\n  LABELS: {{ $labels }}"`;
    
          configs['grafana/dashboards/app-dashboard.json'] = `{
      "annotations": {
        "list": [
          {
            "builtIn": 1,
            "datasource": "-- Grafana --",
            "enable": true,
            "hide": true,
            "iconColor": "rgba(0, 211, 255, 1)",
            "name": "Annotations & Alerts",
            "type": "dashboard"
          }
        ]
      },
      "editable": true,
      "gnetId": null,
      "graphTooltip": 0,
      "id": 1,
      "links": [],
      "panels": [
        {
          "aliasColors": {},
          "bars": false,
          "dashLength": 10,
          "dashes": false,
          "datasource": "Prometheus",
          "fieldConfig": {
            "defaults": {
              "custom": {}
            },
            "overrides": []
          },
          "fill": 1,
          "fillGradient": 0,
          "gridPos": {
            "h": 8,
            "w": 12,
            "x": 0,
            "y": 0
          },
          "hiddenSeries": false,
          "id": 2,
          "legend": {
            "avg": false,
            "current": false,
            "max": false,
            "min": false,
            "show": true,
            "total": false,
            "values": false
          },
          "lines": true,
          "linewidth": 1,
          "nullPointMode": "null",
          "options": {
            "alertThreshold": true
          },
          "percentage": false,
          "pluginVersion": "7.3.7",
          "pointradius": 2,
          "points": false,
          "renderer": "flot",
          "seriesOverrides": [],
          "spaceLength": 10,
          "stack": false,
          "steppedLine": false,
          "targets": [
            {
              "expr": "100 - (avg by(instance) (irate(node_cpu_seconds_total{mode=\\"idle\\"}[5m])) * 100)",
              "interval": "",
              "legendFormat": "CPU Usage - {{instance}}",
              "refId": "A"
            }
          ],
          "thresholds": [],
          "timeFrom": null,
          "timeRegions": [],
          "timeShift": null,
          "title": "CPU Usage",
          "tooltip": {
            "shared": true,
            "sort": 0,
            "value_type": "individual"
          },
          "type": "graph",
          "xaxis": {
            "buckets": null,
            "mode": "time",
            "name": null,
            "show": true,
            "values": []
          },
          "yaxes": [
            {
              "format": "percent",
              "label": null,
              "logBase": 1,
              "max": "100",
              "min": "0",
              "show": true
            },
            {
              "format": "short",
              "label": null,
              "logBase": 1,
              "max": null,
              "min": null,
              "show": true
            }
          ],
          "yaxis": {
            "align": false,
            "alignLevel": null
          }
        },
        {
          "aliasColors": {},
          "bars": false,
          "dashLength": 10,
          "dashes": false,
          "datasource": "Prometheus",
          "fieldConfig": {
            "defaults": {
              "custom": {}
            },
            "overrides": []
          },
          "fill": 1,
          "fillGradient": 0,
          "gridPos": {
            "h": 8,
            "w": 12,
            "x": 12,
            "y": 0
          },
          "hiddenSeries": false,
          "id": 3,
          "legend": {
            "avg": false,
            "current": false,
            "max": false,
            "min": false,
            "show": true,
            "total": false,
            "values": false
          },
          "lines": true,
          "linewidth": 1,
          "nullPointMode": "null",
          "options": {
            "alertThreshold": true
          },
          "percentage": false,
          "pluginVersion": "7.3.7",
          "pointradius": 2,
          "points": false,
          "renderer": "flot",
          "seriesOverrides": [],
          "spaceLength": 10,
          "stack": false,
          "steppedLine": false,
          "targets": [
            {
              "expr": "(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100",
              "interval": "",
              "legendFormat": "Memory Usage - {{instance}}",
              "refId": "A"
            }
          ],
          "thresholds": [],
          "timeFrom": null,
          "timeRegions": [],
          "timeShift": null,
          "title": "Memory Usage",
          "tooltip": {
            "shared": true,
            "sort": 0,
            "value_type": "individual"
          },
          "type": "graph",
          "xaxis": {
            "buckets": null,
            "mode": "time",
            "name": null,
            "show": true,
            "values": []
          },
          "yaxes": [
            {
              "format": "percent",
              "label": null,
              "logBase": 1,
              "max": "100",
              "min": "0",
              "show": true
            },
            {
              "format": "short",
              "label": null,
              "logBase": 1,
              "max": null,
              "min": null,
              "show": true
            }
          ],
          "yaxis": {
            "align": false,
            "alignLevel": null
          }
        }
      ],
      "refresh": "10s",
      "schemaVersion": 26,
      "style": "dark",
      "tags": [],
      "templating": {
        "list": []
      },
      "time": {
        "from": "now-1h",
        "to": "now"
      },
      "timepicker": {
        "refresh_intervals": [
          "5s",
          "10s",
          "30s",
          "1m",
          "5m",
          "15m",
          "30m",
          "1h",
          "2h",
          "1d"
        ]
      },
      "timezone": "",
      "title": "CJ.DevMind - Monitoreo de Aplicación",
      "uid": "cjdevmind",
      "version": 1
    }`;
        }
        
        return configs;
      }
      
      /**
       * Genera documentación DevOps simulada
       */
      private generateSimulatedDevOpsDocs(devopsType: 'ci' | 'cd' | 'docker' | 'iac' | 'monitoring'): string {
        if (devopsType === 'ci') {
          return `## Configuración de Integración Continua
    
    Esta configuración implementa un pipeline de integración continua (CI) utilizando GitHub Actions. El pipeline se ejecuta automáticamente cuando se realizan cambios en las ramas principales o se crean pull requests.
    
    ### Estructura de Archivos
    
    - \`.github/workflows/ci.yml\`: Configuración principal del pipeline de CI
    
    ### Flujo de Trabajo
    
    1. **Activación**: El pipeline se activa en:
       - Push a las ramas \`main\` y \`develop\`
       - Pull requests hacia las ramas \`main\` y \`develop\`
    
    2. **Entorno**: El pipeline se ejecuta en un entorno Ubuntu con múltiples versiones de Node.js (14.x, 16.x, 18.x)
    
    3. **Pasos**:
       - Checkout del código fuente
       - Configuración de Node.js
       - Instalación de dependencias
       - Ejecución de linting
       - Compilación del proyecto
       - Ejecución de pruebas
       - Carga de informes de cobertura a Codecov
    
    ### Requisitos
    
    - Repositorio en GitHub
    - Configuración del token de Codecov en los secretos del repositorio (opcional)
    
    ### Personalización
    
    Para personalizar esta configuración:
    
    1. Ajusta las ramas en la sección \`on\` para adaptarlas a tu flujo de trabajo
    2. Modifica las versiones de Node.js en la matriz según tus requisitos
    3. Agrega o elimina pasos según las necesidades específicas de tu proyecto
    4. Configura variables de entorno adicionales si es necesario
    
    ### Mejores Prácticas
    
    - Mantén las pruebas rápidas para obtener feedback temprano
    - Configura notificaciones para fallos en el pipeline
    - Considera agregar análisis de seguridad y calidad de código
    - Implementa cachés para dependencias y artefactos de compilación
    - Utiliza matrices para probar en múltiples entornos`;
        } else if (devopsType === 'cd') {
          return `## Configuración de Despliegue Continuo
    
    Esta configuración implementa un pipeline de despliegue continuo (CD) utilizando GitHub Actions y Kubernetes. El pipeline automatiza el despliegue de la aplicación en entornos de staging y producción.
    
    ### Estructura de Archivos
    
    - \`.github/workflows/cd.yml\`: Configuración principal del pipeline de CD
    - \`kubernetes/deployment.yaml\`: Configuración del despliegue en Kubernetes
    - \`kubernetes/service.yaml\`: Configuración del servicio en Kubernetes
    
    ### Flujo de Trabajo
    
    1. **Activación**: El pipeline se activa en:
       - Push a la rama \`main\` (despliegue a staging)
       - Creación de tags con formato \`v*\` (despliegue a producción)
    
    2. **Entorno**: El pipeline se ejecuta en un entorno Ubuntu con Node.js 16.x
    
    3. **Pasos**:
       - Checkout del código fuente
       - Configuración de Node.js
       - Instalación de dependencias
       - Compilación del proyecto
       - Ejecución de pruebas
       - Despliegue a producción (solo para tags)
       - Despliegue a staging (solo para push a main)
    
    ### Configuración de Kubernetes
    
    - **Deployment**: Define 3 réplicas de la aplicación con recursos limitados y sondas de salud
    - **Service**: Expone la aplicación dentro del clúster en el puerto 80
    
    ### Requisitos
    
    - Repositorio en GitHub
    - Clúster de Kubernetes configurado
    - Token de despliegue configurado en los secretos del repositorio
    
    ### Personalización
    
    Para personalizar esta configuración:
    
    1. Ajusta las condiciones de activación según tu estrategia de branching
    2. Modifica los recursos asignados en el deployment de Kubernetes
    3. Configura variables de entorno adicionales para tu aplicación
    4. Ajusta las sondas de salud según las necesidades de tu aplicación
    
    ### Mejores Prácticas
    
    - Implementa despliegues canary o blue-green para minimizar el tiempo de inactividad
    - Configura rollbacks automáticos en caso de fallos
    - Mantén secretos y configuraciones sensibles fuera del código
    - Implementa monitoreo y alertas para detectar problemas rápidamente
    - Documenta los procedimientos de rollback manual`;
        } else if (devopsType === 'docker') {
          return `## Configuración de Contenedores Docker
    
    Esta configuración implementa un entorno de desarrollo y producción basado en contenedores Docker para la aplicación CJ.DevMind.
    
    ### Estructura de Archivos
    
    - \`Dockerfile\`: Configuración para construir la imagen de la aplicación
    - \`docker-compose.yml\`: Configuración para orquestar múltiples servicios
    
    ### Dockerfile
    
    El Dockerfile está optimizado para aplicaciones Node.js y sigue las mejores prácticas:
    
    1. **Imagen Base**: Utiliza Node.js 16 en Alpine para minimizar el tamaño
    2. **Dependencias**: Instala solo dependencias de producción
    3. **Construcción**: Compila la aplicación durante la construcción de la imagen
    4. **Exposición**: Expone el puerto 3000 para acceder a la aplicación
    5. **Comando**: Configura el comando de inicio predeterminado
    
    ### Docker Compose
    
    La configuración de Docker Compose define un entorno completo con:
    
    1. **Servicio de Aplicación**:
       - Construido a partir del Dockerfile local
       - Expone el puerto 3000
       - Configurado para reiniciarse automáticamente
       - Conectado a la base de datos
    
    2. **Servicio de Base de Datos**:
       - Utiliza PostgreSQL 14 en Alpine
       - Configura credenciales y nombre de la base de datos
       - Persiste datos en un volumen
    
    3. **Redes y Volúmenes**:
       - Red dedicada para comunicación entre servicios
       - Volumen para persistencia de datos
    
    ### Uso
    
    Para detener el entorno:
    
    \`\`\`bash
    docker-compose down
    \`\`\`
    
    Para reconstruir la imagen de la aplicación:
    \`\`\`bash
    docker-compose build app
    \`\`\`
    
    ### Personalización
    
    Para personalizar esta configuración:
    
    1. Ajusta la versión de Node.js según tus requisitos
    2. Modifica las variables de entorno para configurar la aplicación
    3. Agrega servicios adicionales como Redis, Elasticsearch, etc.
    4. Configura volúmenes adicionales para persistencia de datos
    
    ### Mejores Prácticas
    
    - Utiliza imágenes base oficiales y específicas
    - Minimiza el tamaño de las imágenes usando Alpine cuando sea posible
    - Implementa multi-stage builds para aplicaciones complejas
    - No ejecutes contenedores como root
    - Escanea imágenes en busca de vulnerabilidades
    - Utiliza secretos para gestionar información sensible`;
        } else if (devopsType === 'iac') {
          return `## Configuración de Infraestructura como Código (IaC)
    
    Esta configuración implementa la infraestructura para la aplicación CJ.DevMind utilizando Terraform en AWS.
    
    ### Estructura de Archivos
    
    - \`main.tf\`: Configuración principal de la infraestructura
    - \`variables.tf\`: Definición de variables para personalización
    
    ### Recursos Implementados
    
    1. **Red Virtual (VPC)**:
       - Subredes públicas y privadas en 3 zonas de disponibilidad
       - NAT Gateway para acceso a internet desde subredes privadas
       - Etiquetado para identificación de recursos
    
    2. **Registro de Contenedores (ECR)**:
       - Repositorio para almacenar imágenes Docker
       - Escaneo automático de seguridad
    
    3. **Clúster de Contenedores (ECS)**:
       - Clúster optimizado para aplicaciones en contenedores
       - Insights de contenedores habilitados para monitoreo
    
    4. **Definición de Tarea**:
       - Configurada para Fargate (sin administración de servidores)
       - Recursos de CPU y memoria definidos
       - Mapeo de puertos para acceso a la aplicación
       - Configuración de logs para monitoreo
    
    5. **Roles IAM**:
       - Rol de ejecución para tareas de ECS
       - Políticas mínimas necesarias siguiendo el principio de privilegio mínimo
    
    ### Variables
    
    - \`aws_region\`: Región de AWS donde se desplegará la infraestructura
    - \`environment\`: Entorno (dev, staging, prod) para etiquetado y configuración
    
    ### Uso
    
    Para inicializar Terraform:
    \`\`\`bash
    terraform init
    \`\`\`
    
    Para planificar los cambios:
    \`\`\`bash
    terraform plan -var="environment=dev"
    \`\`\`
    
    Para aplicar los cambios:
    \`\`\`bash
    terraform apply -var="environment=dev"
    \`\`\`
    
    Para destruir la infraestructura:
    \`\`\`bash
    terraform destroy -var="environment=dev"
    \`\`\`
    
    ### Personalización
    
    Para personalizar esta configuración:
    
    1. Ajusta la región de AWS según tus necesidades
    2. Modifica los recursos de CPU y memoria para la aplicación
    3. Agrega servicios adicionales como RDS, ElastiCache, etc.
    4. Configura balanceadores de carga para alta disponibilidad
    
    ### Mejores Prácticas
    
    - Utiliza el control de versiones para la configuración de infraestructura
    - Implementa el estado remoto de Terraform para colaboración en equipo
    - Separa la infraestructura por entornos (dev, staging, prod)
    - Utiliza módulos para componentes reutilizables
    - Implementa bloqueo de estado para evitar conflictos
    - Automatiza la aplicación de cambios a través de pipelines de CI/CD`;
        } else {
          return `## Configuración de Monitoreo y Observabilidad
    
    Esta configuración implementa un sistema completo de monitoreo y observabilidad para la aplicación CJ.DevMind utilizando Prometheus y Grafana.
    
    ### Estructura de Archivos
    
    - \`prometheus/prometheus.yml\`: Configuración principal de Prometheus
    - \`prometheus/alert_rules.yml\`: Reglas de alertas para Prometheus
    - \`grafana/dashboards/app-dashboard.json\`: Dashboard preconfigurado para Grafana
    
    ### Componentes
    
    1. **Prometheus**:
       - Configurado para recopilar métricas cada 15 segundos
       - Integración con Alertmanager para gestión de alertas
       - Configurado para monitorear:
         - El propio Prometheus
         - Node Exporter (métricas del sistema)
         - Aplicación CJ.DevMind
    
    2. **Reglas de Alertas**:
       - Alertas para uso elevado de CPU (>80%)
       - Alertas para uso elevado de memoria (>80%)
       - Alertas para latencia elevada de API (>1s)
    
    3. **Dashboard de Grafana**:
       - Visualización de uso de CPU
       - Visualización de uso de memoria
              - Actualización automática cada 10 segundos
    
    3. **Alertmanager**:
       - Configurado para enviar notificaciones por diferentes canales
       - Agrupación de alertas para evitar sobrecarga de notificaciones
       - Silenciamiento configurable para mantenimientos programados
    
    ### Uso
    
    Para iniciar el sistema de monitoreo:
    
    ```bash
    docker-compose -f docker-compose.monitoring.yml up -d
    ```
    
    Para acceder a las interfaces:
    - Prometheus: http://localhost:9090
    - Grafana: http://localhost:3000 (usuario: admin, contraseña: admin)
    - Alertmanager: http://localhost:9093
    
    ### Personalización
    
    Para personalizar esta configuración:
    
    1. Agrega nuevas reglas de alerta en el archivo alert_rules.yml
    2. Configura nuevos targets en prometheus.yml para monitorear más servicios
    3. Importa o crea dashboards adicionales en Grafana
    4. Ajusta los umbrales de alerta según las características de tu infraestructura
    
    ### Mejores Prácticas
    
    - Implementa monitoreo de extremo a extremo (black-box monitoring)
    - Configura alertas accionables que requieran intervención humana
    - Mantén dashboards simples y enfocados en métricas clave
    - Implementa retención de datos adecuada para optimizar el almacenamiento
    - Documenta el significado de cada métrica y alerta
    - Realiza pruebas periódicas del sistema de alertas`;
        }
      }
  
  /**
   * Genera scripts DevOps simulados
   */
  private generateSimulatedDevOpsScripts(devopsType: 'ci' | 'cd' | 'docker' | 'iac' | 'monitoring'): Record<string, string> {
    const scripts: Record<string, string> = {};
    
    if (devopsType === 'ci') {
      scripts['setup-ci.sh'] = `#!/bin/bash
# Script para configurar el entorno de CI localmente

# Crear directorios necesarios
mkdir -p .github/workflows

# Copiar archivo de configuración de CI
cp devops/.github/workflows/ci.yml .github/workflows/

# Verificar herramientas necesarias
echo "Verificando herramientas necesarias..."

if ! command -v node &> /dev/null; then
    echo "Node.js no está instalado. Por favor, instálalo desde https://nodejs.org/"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "npm no está instalado. Por favor, instálalo junto con Node.js"
    exit 1
fi

# Instalar dependencias de desarrollo
echo "Instalando dependencias de desarrollo..."
npm install --save-dev jest eslint prettier

# Agregar scripts al package.json
echo "Actualizando package.json..."
npm set-script lint "eslint ."
npm set-script test "jest --coverage"
npm set-script format "prettier --write ."

# Crear configuración básica de ESLint si no existe
if [ ! -f .eslintrc.js ]; then
    echo "Creando configuración de ESLint..."
    echo "module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-console': 'warn',
  },
};" > .eslintrc.js
fi

# Crear configuración básica de Jest si no existe
if [ ! -f jest.config.js ]; then
    echo "Creando configuración de Jest..."
    echo "module.exports = {
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};" > jest.config.js
fi

echo "✅ Configuración de CI completada con éxito"
echo "Puedes ejecutar las verificaciones localmente con:"
echo "  npm run lint"
echo "  npm run test"
echo "  npm run format"
`;

      scripts['pre-commit.sh'] = `#!/bin/bash
# Script de pre-commit para verificar el código antes de confirmar cambios

# Guardar archivos modificados
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\\.(js|jsx|ts|tsx)$')

if [ -z "$STAGED_FILES" ]; then
    echo "No hay archivos JavaScript/TypeScript para verificar"
    exit 0
fi

# Ejecutar ESLint en los archivos modificados
echo "Ejecutando ESLint..."
npx eslint $STAGED_FILES

if [ $? -ne 0 ]; then
    echo "❌ ESLint encontró errores. Por favor, corrígelos antes de confirmar."
    exit 1
fi

# Ejecutar Prettier en los archivos modificados
echo "Ejecutando Prettier..."
npx prettier --check $STAGED_FILES

if [ $? -ne 0 ]; then
    echo "❌ Prettier encontró errores de formato. Ejecuta 'npm run format' para corregirlos."
    exit 1
fi

# Ejecutar pruebas
echo "Ejecutando pruebas..."
npm test

if [ $? -ne 0 ]; then
    echo "❌ Las pruebas fallaron. Por favor, corrígelas antes de confirmar."
    exit 1
fi

echo "✅ Todas las verificaciones pasaron con éxito"
exit 0
`;
    } else if (devopsType === 'cd') {
      scripts['deploy.sh'] = `#!/bin/bash
# Script para desplegar la aplicación en diferentes entornos

# Verificar argumentos
if [ $# -lt 1 ]; then
    echo "Uso: $0 <environment> [version]"
    echo "  environment: staging|production"
    echo "  version: versión específica (opcional, por defecto: latest)"
    exit 1
fi

ENVIRONMENT=$1
VERSION=${2:-latest}
NAMESPACE="cj-devmind-$ENVIRONMENT"

# Verificar herramientas necesarias
if ! command -v kubectl &> /dev/null; then
    echo "kubectl no está instalado. Por favor, instálalo primero."
    exit 1
fi

echo "🚀 Desplegando CJ.DevMind versión $VERSION en $ENVIRONMENT..."

# Configurar kubectl para el entorno correcto
if [ "$ENVIRONMENT" == "production" ]; then
    KUBECONFIG_CONTEXT="cj-devmind-prod"
elif [ "$ENVIRONMENT" == "staging" ]; then
    KUBECONFIG_CONTEXT="cj-devmind-staging"
else
    echo "❌ Entorno desconocido: $ENVIRONMENT"
    exit 1
fi

# Cambiar al contexto correcto
kubectl config use-context $KUBECONFIG_CONTEXT

# Crear namespace si no existe
kubectl get namespace $NAMESPACE &> /dev/null || kubectl create namespace $NAMESPACE

# Actualizar la imagen en los archivos de despliegue
sed -i "s|image: cj-devmind:.*|image: cj-devmind:$VERSION|g" kubernetes/deployment.yaml

# Aplicar configuración
echo "Aplicando configuración de Kubernetes..."
kubectl apply -f kubernetes/deployment.yaml -n $NAMESPACE
kubectl apply -f kubernetes/service.yaml -n $NAMESPACE

# Verificar despliegue
echo "Verificando despliegue..."
kubectl rollout status deployment/cj-devmind -n $NAMESPACE

if [ $? -eq 0 ]; then
    echo "✅ Despliegue completado con éxito en $ENVIRONMENT"
    
    # Obtener URL de acceso
    if [ "$ENVIRONMENT" == "production" ]; then
        echo "🌐 La aplicación está disponible en: https://app.cjdevmind.com"
    else
        echo "🌐 La aplicación está disponible en: https://staging.cjdevmind.com"
    fi
else
    echo "❌ Error en el despliegue. Revisa los logs para más detalles:"
    echo "kubectl logs -l app=cj-devmind -n $NAMESPACE"
    exit 1
fi
`;

      scripts['rollback.sh'] = `#!/bin/bash
# Script para realizar rollback a una versión anterior

# Verificar argumentos
if [ $# -lt 2 ]; then
    echo "Uso: $0 <environment> <version>"
    echo "  environment: staging|production"
    echo "  version: versión anterior a la que hacer rollback"
    exit 1
fi

ENVIRONMENT=$1
VERSION=$2
NAMESPACE="cj-devmind-$ENVIRONMENT"

# Verificar herramientas necesarias
if ! command -v kubectl &> /dev/null; then
    echo "kubectl no está instalado. Por favor, instálalo primero."
    exit 1
fi

echo "🔄 Realizando rollback a la versión $VERSION en $ENVIRONMENT..."

# Configurar kubectl para el entorno correcto
if [ "$ENVIRONMENT" == "production" ]; then
    KUBECONFIG_CONTEXT="cj-devmind-prod"
elif [ "$ENVIRONMENT" == "staging" ]; then
    KUBECONFIG_CONTEXT="cj-devmind-staging"
else
    echo "❌ Entorno desconocido: $ENVIRONMENT"
    exit 1
fi

# Cambiar al contexto correcto
kubectl config use-context $KUBECONFIG_CONTEXT

# Actualizar la imagen en los archivos de despliegue
sed -i "s|image: cj-devmind:.*|image: cj-devmind:$VERSION|g" kubernetes/deployment.yaml

# Aplicar configuración
echo "Aplicando rollback..."
kubectl apply -f kubernetes/deployment.yaml -n $NAMESPACE

# Verificar despliegue
echo "Verificando rollback..."
kubectl rollout status deployment/cj-devmind -n $NAMESPACE

if [ $? -eq 0 ]; then
    echo "✅ Rollback completado con éxito a la versión $VERSION en $ENVIRONMENT"
else
    echo "❌ Error en el rollback. Revisa los logs para más detalles:"
    echo "kubectl logs -l app=cj-devmind -n $NAMESPACE"
    exit 1
fi
`;
    } else if (devopsType === 'docker') {
      scripts['docker-build.sh'] = `#!/bin/bash
# Script para construir y ejecutar la aplicación con Docker

# Verificar argumentos
if [ $# -gt 0 ]; then
    TAG=$1
else
    TAG="latest"
fi

# Verificar herramientas necesarias
if ! command -v docker &> /dev/null; then
    echo "Docker no está instalado. Por favor, instálalo primero."
    exit 1
fi

echo "🔨 Construyendo imagen Docker con tag: $TAG"

# Construir la imagen
docker build -t cj-devmind:$TAG .

if [ $? -ne 0 ]; then
    echo "❌ Error al construir la imagen Docker"
    exit 1
fi

echo "✅ Imagen Docker construida con éxito: cj-devmind:$TAG"

# Preguntar si se desea ejecutar la aplicación
read -p "¿Deseas ejecutar la aplicación ahora? (s/n): " EJECUTAR

if [ "$EJECUTAR" = "s" ] || [ "$EJECUTAR" = "S" ]; then
    echo "🚀 Iniciando contenedor..."
    
    # Detener contenedor existente si está en ejecución
    CONTAINER_ID=$(docker ps -q --filter "name=cj-devmind")
    if [ ! -z "$CONTAINER_ID" ]; then
        echo "Deteniendo contenedor existente..."
        docker stop cj-devmind
        docker rm cj-devmind
    fi
    
    # Ejecutar el contenedor
    docker run -d --name cj-devmind -p 3000:3000 cj-devmind:$TAG
    
    if [ $? -eq 0 ]; then
        echo "✅ Aplicación iniciada en http://localhost:3000"
    else
        echo "❌ Error al iniciar la aplicación"
        exit 1
    fi
fi
`;

      scripts['docker-compose-up.sh'] = `#!/bin/bash
# Script para iniciar el entorno completo con Docker Compose

# Verificar herramientas necesarias
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose no está instalado. Por favor, instálalo primero."
    exit 1
fi

echo "🚀 Iniciando entorno con Docker Compose..."

# Construir e iniciar los servicios
docker-compose up -d --build

if [ $? -ne 0 ]; then
    echo "❌ Error al iniciar el entorno con Docker Compose"
    exit 1
fi

echo "✅ Entorno iniciado con éxito"
echo "📊 Estado de los servicios:"
docker-compose ps

echo "🌐 La aplicación está disponible en: http://localhost:3000"
echo "📝 Para ver los logs: docker-compose logs -f"
echo "🛑 Para detener el entorno: docker-compose down"
`;
    } else if (devopsType === 'iac') {
      scripts['deploy-infrastructure.sh'] = `#!/bin/bash
# Script para desplegar infraestructura con Terraform

# Verificar argumentos
if [ $# -lt 1 ]; then
    echo "Uso: $0 <environment>"
    echo "  environment: dev|staging|prod"
    exit 1
fi

ENVIRONMENT=$1

# Verificar herramientas necesarias
if ! command -v terraform &> /dev/null; then
    echo "Terraform no está instalado. Por favor, instálalo primero."
    exit 1
fi

echo "🏗️ Desplegando infraestructura para entorno: $ENVIRONMENT"

# Inicializar Terraform si es necesario
if [ ! -d ".terraform" ]; then
    echo "Inicializando Terraform..."
    terraform init
    
    if [ $? -ne 0 ]; then
        echo "❌ Error al inicializar Terraform"
        exit 1
    fi
fi

# Seleccionar workspace o crearlo si no existe
terraform workspace select $ENVIRONMENT 2>/dev/null || terraform workspace new $ENVIRONMENT

# Planificar cambios
echo "Planificando cambios..."
terraform plan -var="environment=$ENVIRONMENT" -out=tfplan

if [ $? -ne 0 ]; then
    echo "❌ Error al planificar cambios"
    exit 1
fi

# Preguntar antes de aplicar
read -p "¿Deseas aplicar estos cambios? (s/n): " APLICAR

if [ "$APLICAR" = "s" ] || [ "$APLICAR" = "S" ]; then
    echo "Aplicando cambios..."
    terraform apply tfplan
    
    if [ $? -eq 0 ]; then
        echo "✅ Infraestructura desplegada con éxito"
    else
        echo "❌ Error al desplegar la infraestructura"
        exit 1
    fi
else
    echo "Operación cancelada"
fi
`;

      scripts['destroy-infrastructure.sh'] = `#!/bin/bash
# Script para destruir infraestructura con Terraform

# Verificar argumentos
if [ $# -lt 1 ]; then
    echo "Uso: $0 <environment>"
    echo "  environment: dev|staging|prod"
    exit 1
fi

ENVIRONMENT=$1

# Verificar herramientas necesarias
if ! command -v terraform &> /dev/null; then
    echo "Terraform no está instalado. Por favor, instálalo primero."
    exit 1
fi

# Advertencia para entornos de producción
if [ "$ENVIRONMENT" = "prod" ]; then
    echo "⚠️ ¡ADVERTENCIA! Estás a punto de destruir el entorno de PRODUCCIÓN"
    echo "Esta acción es irreversible y puede causar pérdida de datos"
    read -p "Escribe 'DESTRUIR-PRODUCCION' para confirmar: " CONFIRMACION
    
    if [ "$CONFIRMACION" != "DESTRUIR-PRODUCCION" ]; then
        echo "Operación cancelada"
        exit 1
    fi
fi

echo "🧨 Destruyendo infraestructura para entorno: $ENVIRONMENT"

# Seleccionar workspace
terraform workspace select $ENVIRONMENT

if [ $? -ne 0 ]; then
    echo "❌ El entorno $ENVIRONMENT no existe"
    exit 1
fi

# Planificar destrucción
echo "Planificando destrucción..."
terraform plan -destroy -var="environment=$ENVIRONMENT" -out=tfplan

# Preguntar antes de destruir
read -p "¿Estás SEGURO de que deseas DESTRUIR esta infraestructura? (s/n): " DESTRUIR

if [ "$DESTRUIR" = "s" ] || [ "$DESTRUIR" = "S" ]; then
    echo "Destruyendo infraestructura..."
    terraform apply tfplan
    
    if [ $? -eq 0 ]; then
        echo "✅ Infraestructura destruida con éxito"
    else
        echo "❌ Error al destruir la infraestructura"
        exit 1
    fi
else
    echo "Operación cancelada"
fi
`;
    } else if (devopsType === 'monitoring') {
      scripts['setup-monitoring.sh'] = `#!/bin/bash
# Script para configurar el sistema de monitoreo

# Verificar herramientas necesarias
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose no está instalado. Por favor, instálalo primero."
    exit 1
fi

echo "🔍 Configurando sistema de monitoreo..."

# Crear directorios necesarios
mkdir -p prometheus/data grafana/data

# Copiar archivos de configuración
cp devops/prometheus/prometheus.yml prometheus/
cp devops/prometheus/alert_rules.yml prometheus/
mkdir -p grafana/dashboards
cp devops/grafana/dashboards/app-dashboard.json grafana/dashboards/

# Crear docker-compose para monitoreo
cat > docker-compose.monitoring.yml << 'EOF'
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./prometheus/alert_rules.yml:/etc/prometheus/alert_rules.yml
      - ./prometheus/data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    ports:
      - "9090:9090"
    restart: unless-stopped
    networks:
      - monitoring-network

  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    restart: unless-stopped
    networks:
      - monitoring-network

  grafana:
    image: grafana/grafana:latest
    volumes:
      - ./grafana/data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    ports:
      - "3000:3000"
    restart: unless-stopped
    networks:
      - monitoring-network

  node-exporter:
    image: prom/node-exporter:latest
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.ignored-mount-points=^/(sys|proc|dev|host|etc)($$|/)'
    ports:
      - "9100:9100"
    restart: unless-stopped
    networks:
      - monitoring-network

networks:
  monitoring-network:
    driver: bridge
EOF

echo "✅ Configuración de monitoreo creada con éxito"
echo "Para iniciar el sistema de monitoreo, ejecuta:"
echo "  docker-compose -f docker-compose.monitoring.yml up -d"
echo "Acceso a las interfaces:"
echo "  - Prometheus: http://localhost:9090"
echo "  - Grafana: http://localhost:3000 (admin/admin)"
`;

      scripts['check-alerts.sh'] = `#!/bin/bash
# Script para verificar alertas activas

# Verificar herramientas necesarias
if ! command -v curl &> /dev/null; then
    echo "curl no está instalado. Por favor, instálalo primero."
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "jq no está instalado. Por favor, instálalo primero."
    exit 1
fi

echo "🔔 Verificando alertas activas..."

# Verificar si Prometheus está en ejecución
if ! curl -s http://localhost:9090 > /dev/null; then
    echo "❌ Prometheus no está en ejecución. Inicia el sistema de monitoreo primero."
    exit 1
fi

# Obtener alertas activas
ALERTS=$(curl -s http://localhost:9090/api/v1/alerts | jq '.data.alerts')
ALERT_COUNT=$(echo $ALERTS | jq 'length')

if [ "$ALERT_COUNT" -eq "0" ]; then
    echo "✅ No hay alertas activas"
else
    echo "⚠️ Hay $ALERT_COUNT alertas activas:"
    echo $ALERTS | jq -r '.[] | "- " + .labels.alertname + ": " + .annotations.description'
fi

# Verificar estado de los servicios
echo "📊 Estado de los servicios de monitoreo:"
docker-compose -f docker-compose.monitoring.yml ps
`;
    }
    
    return scripts;
  }
} 