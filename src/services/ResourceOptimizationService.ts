/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Redis } from 'ioredis';
import { DockerService } from './DockerService';
import { MetricsCollector } from '@/lib/metrics';
import { CloudflareService } from './CloudflareService';

interface ResourceMetrics {
  cpu: {
    usage: number;
    throttling: number;
    cores: number;
  };
  memory: {
    used: number;
    available: number;
    swap: number;
    cached: number;
  };
  network: {
    ingress: number;
    egress: number;
    latency: number;
  };
  storage: {
    used: number;
    available: number;
    iops: number;
    throughput: number;
  };
}

interface OptimizationStrategy {
  cpu: {
    limit: 'fixed' | 'dynamic';
    burstable: boolean;
    autoScale: boolean;
  };
  memory: {
    limit: 'fixed' | 'dynamic';
    swapStrategy: 'aggressive' | 'conservative' | 'disabled';
    gcOptimization: boolean;
  };
  storage: {
    compression: boolean;
    deduplication: boolean;
    tieringEnabled: boolean;
  };
}

interface AutotuningConfig {
  enabled: boolean;
  learningRate: number;
  adaptationInterval: string;
}

interface OptimizationResult {
  recommendations: {
    cpu?: {
      cores: number;
      limit: number;
      throttleThreshold: number;
    };
    memory?: {
      limit: number;
      swapLimit: number;
      gcThreshold: number;
    };
    storage?: {
      compressionLevel: number;
      dedupBlockSize: number;
      tieringPolicy: string;
    };
  };
  projectedSavings: {
    cpu: number;
    memory: number;
    storage: number;
    cost: number;
  };
}

export class ResourceOptimizationService {
  private redis: Redis;
  private docker: DockerService;
  private metrics: MetricsCollector;
  private cloudflare: CloudflareService;
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly METRICS_WINDOW = 24 * 60 * 60; // 24 hours

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
    this.docker = new DockerService();
    this.metrics = new MetricsCollector();
    this.cloudflare = new CloudflareService();
  }

  async optimizeResources(config: {
    projectId: string;
    strategies: OptimizationStrategy;
    autotuning: AutotuningConfig;
  }): Promise<OptimizationResult> {
    try {
      // 1. Collect historical metrics
      const metrics = await this.collectHistoricalMetrics(config.projectId);

      // 2. Analyze current resource usage patterns
      const analysis = await this.analyzeResourcePatterns(metrics);

      // 3. Apply machine learning for prediction
      const predictions = await this.predictResourceNeeds(analysis);

      // 4. Generate optimization recommendations
      const recommendations = await this.generateRecommendations(
        predictions,
        config.strategies
      );

      // 5. Apply optimizations if autotuning is enabled
      if (config.autotuning.enabled) {
        await this.applyOptimizations(config.projectId, recommendations);
      }

      // 6. Calculate projected savings
      const savings = await this.calculateProjectedSavings(
        metrics,
        recommendations
      );

      // 7. Store optimization results
      await this.storeOptimizationResults(config.projectId, {
        recommendations,
        savings
      });

      return { recommendations, projectedSavings: savings };
    } catch (error) {
      logger.error('Resource optimization failed:', error);
      throw new Error('Failed to optimize resources');
    }
  }

  private async collectHistoricalMetrics(projectId: string): Promise<ResourceMetrics[]> {
    const cacheKey = `metrics:${projectId}:history`;
    const cachedMetrics = await this.redis.get(cacheKey);

    if (cachedMetrics) {
      return JSON.parse(cachedMetrics);
    }

    const metrics = await prisma.performanceMetrics.findMany({
      where: {
        projectId,
        timestamp: {
          gte: new Date(Date.now() - this.METRICS_WINDOW * 1000)
        }
      },
      orderBy: { timestamp: 'asc' }
    });

    const formattedMetrics = metrics.map(m => this.formatMetrics(m.metrics));
    await this.redis.set(cacheKey, JSON.stringify(formattedMetrics), 'EX', this.CACHE_TTL);

    return formattedMetrics;
  }

  private async analyzeResourcePatterns(metrics: ResourceMetrics[]): Promise<any> {
    // Implement time series analysis
    const patterns = {
      cpu: this.analyzeCPUPatterns(metrics),
      memory: this.analyzeMemoryPatterns(metrics),
      storage: this.analyzeStoragePatterns(metrics),
      network: this.analyzeNetworkPatterns(metrics)
    };
    // Convert patterns object to array format
    const patternsArray = Object.values(patterns);

    // Detect anomalies and patterns
    const anomalies = await this.detectAnomalies(patternsArray);
    const trends = await this.analyzeTrends(patternsArray);

    return {
      patterns,
      anomalies,
      trends,
      seasonality: this.detectSeasonality(metrics)
    };
  }

  private async predictResourceNeeds(analysis: any): Promise<any> {
    // Implement ML-based prediction
    const predictions = {
      shortTerm: await this.shortTermPrediction(analysis),
      mediumTerm: await this.mediumTermPrediction(analysis),
      longTerm: await this.longTermPrediction(analysis)
    };

    return predictions;
  }

  private async generateRecommendations(
    predictions: any,
    strategies: OptimizationStrategy
  ): Promise<any> {
    const recommendations = {
      cpu: this.generateCPURecommendations(predictions, strategies.cpu),
      memory: this.generateMemoryRecommendations(predictions, strategies.memory),
      storage: this.generateStorageRecommendations(predictions, strategies.storage)
    };

    return this.validateRecommendations(recommendations);
  }

  private async applyOptimizations(
    projectId: string,
    recommendations: any
  ): Promise<void> {
    // Apply CPU optimizations
    await this.applyCPUOptimizations(projectId, recommendations.cpu);

    // Apply memory optimizations
    await this.applyMemoryOptimizations(projectId, recommendations.memory);

    // Apply storage optimizations
    await this.applyStorageOptimizations(projectId, recommendations.storage);

    // Update project configuration
    await this.updateProjectConfig(projectId, recommendations);
  }

  private async calculateProjectedSavings(
    metrics: ResourceMetrics[],
    recommendations: any
  ): Promise<any> {
    const currentCosts = await this.calculateCurrentCosts(metrics);
    const projectedCosts = await this.calculateProjectedCosts(recommendations);

    return {
      cpu: currentCosts.cpu - projectedCosts.cpu,
      memory: currentCosts.memory - projectedCosts.memory,
      storage: currentCosts.storage - projectedCosts.storage,
      cost: currentCosts.total - projectedCosts.total
    };
  }

  private formatMetrics(metrics: any): ResourceMetrics {
    return {
      cpu: {
        usage: metrics.cpu?.usage || 0,
        throttling: metrics.cpu?.throttling || 0,
        cores: metrics.cpu?.cores || 1
      },
      memory: {
        used: metrics.memory?.used || 0,
        available: metrics.memory?.available || 0,
        swap: metrics.memory?.swap || 0,
        cached: metrics.memory?.cached || 0
      },
      network: {
        ingress: metrics.network?.ingress || 0,
        egress: metrics.network?.egress || 0,
        latency: metrics.network?.latency || 0
      },
      storage: {
        used: metrics.storage?.used || 0,
        available: metrics.storage?.available || 0,
        iops: metrics.storage?.iops || 0,
        throughput: metrics.storage?.throughput || 0
      }
    };
  }

  private analyzeCPUPatterns(metrics: ResourceMetrics[]): any {
    const usagePatterns = metrics.map(m => ({
      timestamp: new Date(),
      usage: m.cpu.usage,
      throttling: m.cpu.throttling
    }));

    return {
      averageUsage: this.calculateAverage(usagePatterns.map(p => p.usage)),
      peakUsage: Math.max(...usagePatterns.map(p => p.usage)),
      throttlingEvents: usagePatterns.filter(p => p.throttling > 0).length,
      utilizationTrend: this.calculateTrend(usagePatterns.map(p => p.usage))
    };
  }

  private analyzeMemoryPatterns(metrics: ResourceMetrics[]): any {
    const memoryPatterns = metrics.map(m => ({
      timestamp: new Date(),
      used: m.memory.used,
      available: m.memory.available,
      swap: m.memory.swap
    }));

    return {
      averageUsage: this.calculateAverage(memoryPatterns.map(p => p.used)),
      peakUsage: Math.max(...memoryPatterns.map(p => p.used)),
      swapUsage: this.calculateAverage(memoryPatterns.map(p => p.swap)),
      memoryPressure: this.calculateMemoryPressure(memoryPatterns)
    };
  }

  private analyzeStoragePatterns(metrics: ResourceMetrics[]): any {
    const storagePatterns = metrics.map(m => ({
      timestamp: new Date(),
      used: m.storage.used,
      iops: m.storage.iops,
      throughput: m.storage.throughput
    }));

    return {
      averageUsage: this.calculateAverage(storagePatterns.map(p => p.used)),
      iopsPattern: this.analyzeIOPS(storagePatterns),
      throughputTrend: this.calculateTrend(storagePatterns.map(p => p.throughput)),
      growthRate: this.calculateGrowthRate(storagePatterns.map(p => p.used))
    };
  }

  private analyzeNetworkPatterns(metrics: ResourceMetrics[]): any {
    const networkPatterns = metrics.map(m => ({
      timestamp: new Date(),
      ingress: m.network.ingress,
      egress: m.network.egress,
      latency: m.network.latency
    }));

    return {
      averageIngress: this.calculateAverage(networkPatterns.map(p => p.ingress)),
      averageEgress: this.calculateAverage(networkPatterns.map(p => p.egress)),
      latencyPattern: this.analyzeLatency(networkPatterns),
      bandwidthUtilization: this.calculateBandwidthUtilization(networkPatterns)
    };
  }


  

  

  private async storeOptimizationResults(projectId: string, results: any): Promise<void> {
    try {
      await prisma.optimizationMetrics.create({
        data: {
          projectId,
          type: 'OPTIMIZATION',
          data: results,
          timestamp: new Date()
        }
      });

      // Cache the results
      await this.redis.set(
        `optimization:${projectId}:latest`,
        JSON.stringify(results),
        'EX',
        this.CACHE_TTL
      );
    } catch (error) {
      logger.error('Failed to store optimization results:', error);
      throw error;
    }
  }

  // Helper methods for calculations
  private calculateAverage(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateTrend(values: number[]): number {
    // Simple linear regression
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = this.calculateAverage(values);
    
    let numerator = 0;
    let denominator = 0;
    
    values.forEach((y, x) => {
      numerator += (x - xMean) * (y - yMean);
      denominator += Math.pow(x - xMean, 2);
    });
    
    return numerator / denominator;
  }

  private calculateMemoryPressure(patterns: any[]): number {
    return patterns.reduce((pressure, p) => {
      const usageRatio = p.used / (p.used + p.available);
      const swapImpact = p.swap > 0 ? 1.5 : 1;
      return pressure + (usageRatio * swapImpact);
    }, 0) / patterns.length;
  }

  private analyzeIOPS(patterns: any[]): any {
    const iopsValues = patterns.map(p => p.iops);
    return {
      average: this.calculateAverage(iopsValues),
      peak: Math.max(...iopsValues),
      trend: this.calculateTrend(iopsValues)
    };
  }

  private analyzeLatency(patterns: any[]): any {
    const latencyValues = patterns.map(p => p.latency);
    return {
      average: this.calculateAverage(latencyValues),
      p95: this.calculatePercentile(latencyValues, 95),
      p99: this.calculatePercentile(latencyValues, 99)
    };
  }

  private calculateBandwidthUtilization(patterns: any[]): number {
    return patterns.reduce((util, p) => {
      const totalBandwidth = p.ingress + p.egress;
      return util + totalBandwidth;
    }, 0) / patterns.length;
  }

  private calculateGrowthRate(values: number[]): number {
    if (values.length < 2) return 0;
    const first = values[0];
    const last = values[values.length - 1];
    return (last - first) / first;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  // ML Prediction Methods
  private async shortTermPrediction(analysis: any): Promise<any> {
    const { patterns, trends } = analysis;
    return {
      cpu: this.predictResourceMetric(patterns.cpu, trends.cpu, '1h'),
      memory: this.predictResourceMetric(patterns.memory, trends.memory, '1h'),
      storage: this.predictResourceMetric(patterns.storage, trends.storage, '1h'),
      network: this.predictResourceMetric(patterns.network, trends.network, '1h')
    };
  }

  private async mediumTermPrediction(analysis: any): Promise<any> {
    const { patterns, trends, seasonality } = analysis;
    return {
      cpu: this.predictResourceMetric(patterns.cpu, trends.cpu, '24h', seasonality.daily),
      memory: this.predictResourceMetric(patterns.memory, trends.memory, '24h', seasonality.daily),
      storage: this.predictResourceMetric(patterns.storage, trends.storage, '24h', seasonality.daily),
      network: this.predictResourceMetric(patterns.network, trends.network, '24h', seasonality.daily)
    };
  }

  private async longTermPrediction(analysis: any): Promise<any> {
    const { patterns, trends, seasonality } = analysis;
    return {
      cpu: this.predictResourceMetric(patterns.cpu, trends.cpu, '7d', seasonality.weekly),
      memory: this.predictResourceMetric(patterns.memory, trends.memory, '7d', seasonality.weekly),
      storage: this.predictResourceMetric(patterns.storage, trends.storage, '7d', seasonality.weekly),
      network: this.predictResourceMetric(patterns.network, trends.network, '7d', seasonality.weekly)
    };
  }

  private predictResourceMetric(
    pattern: any,
    trend: any,
    timeframe: string,
    seasonality?: any
  ): any {
    const baselinePrediction = pattern.averageUsage + (trend * this.getTimeframeMultiplier(timeframe));
    const seasonalityFactor = seasonality ? this.calculateSeasonalityFactor(seasonality) : 1;
    return baselinePrediction * seasonalityFactor;
  }

  // Recommendation Generation Methods
  private generateCPURecommendations(predictions: any, strategy: OptimizationStrategy['cpu']): any {
    const maxPredictedUsage = Math.max(
      predictions.shortTerm.cpu,
      predictions.mediumTerm.cpu,
      predictions.longTerm.cpu
    );

    const recommendedCores = Math.ceil(maxPredictedUsage / 100);
    const limit = strategy.limit === 'dynamic' 
      ? this.calculateDynamicLimit(maxPredictedUsage, 1.2) // 20% buffer
      : maxPredictedUsage * 1.5; // Fixed 50% buffer

    return {
      cores: recommendedCores,
      limit,
      throttleThreshold: strategy.burstable ? limit * 0.8 : limit
    };
  }

  private generateMemoryRecommendations(predictions: any, strategy: OptimizationStrategy['memory']): any {
    const maxPredictedUsage = Math.max(
      predictions.shortTerm.memory,
      predictions.mediumTerm.memory,
      predictions.longTerm.memory
    );

    const baseLimit = strategy.limit === 'dynamic'
      ? this.calculateDynamicLimit(maxPredictedUsage, 1.3) // 30% buffer
      : maxPredictedUsage * 1.6; // Fixed 60% buffer

    const swapLimit = strategy.swapStrategy === 'disabled' ? 0 :
      strategy.swapStrategy === 'aggressive' ? baseLimit * 0.5 : baseLimit * 0.25;

    return {
      limit: baseLimit,
      swapLimit,
      gcThreshold: strategy.gcOptimization ? baseLimit * 0.7 : baseLimit * 0.85
    };
  }

  private generateStorageRecommendations(predictions: any, strategy: OptimizationStrategy['storage']): any {
    const predictedUsage = predictions.longTerm.storage;
    const growthRate = this.calculateGrowthRate(predictions.storage);

    return {
      compressionLevel: strategy.compression ? this.determineCompressionLevel(predictedUsage) : 0,
      dedupBlockSize: strategy.deduplication ? this.calculateOptimalDedupBlockSize(predictedUsage) : 0,
      tieringPolicy: strategy.tieringEnabled ? this.determineTieringPolicy(predictedUsage, growthRate) : 'none'
    };
  }

  private validateRecommendations(recommendations: any): any {
    // Validate CPU recommendations
    if (recommendations.cpu.cores < 1) recommendations.cpu.cores = 1;
    if (recommendations.cpu.limit < recommendations.cpu.cores * 100) {
      recommendations.cpu.limit = recommendations.cpu.cores * 100;
    }

    // Validate memory recommendations
    if (recommendations.memory.limit < 256) recommendations.memory.limit = 256; // Minimum 256MB
    if (recommendations.memory.swapLimit > recommendations.memory.limit) {
      recommendations.memory.swapLimit = recommendations.memory.limit;
    }

    // Validate storage recommendations
    if (recommendations.storage.compressionLevel > 9) recommendations.storage.compressionLevel = 9;
    if (recommendations.storage.dedupBlockSize < 4096) recommendations.storage.dedupBlockSize = 4096;

    return recommendations;
  }

  // Optimization Application Methods
  private async applyCPUOptimizations(projectId: string, recommendations: any): Promise<void> {
    try {
      await this.docker.updateContainerResources(projectId, {
        NanoCPUs: recommendations.cores * 1000000000,
        CpuQuota: recommendations.limit * 1000,
        CpuPeriod: 100000
      });

      await this.metrics.recordOptimization('cpu', projectId, recommendations);
    } catch (error) {
      logger.error('Failed to apply CPU optimizations:', error);
      throw error;
    }
  }

  private async applyMemoryOptimizations(projectId: string, recommendations: any): Promise<void> {
    try {
      await this.docker.updateContainerResources(projectId, {
        Memory: recommendations.limit * 1024 * 1024,
        MemorySwap: (recommendations.limit + recommendations.swapLimit) * 1024 * 1024,
        MemoryReservation: recommendations.gcThreshold * 1024 * 1024
      });

      await this.metrics.recordOptimization('memory', projectId, recommendations);
    } catch (error) {
      logger.error('Failed to apply memory optimizations:', error);
      throw error;
    }
  }

  private async applyStorageOptimizations(projectId: string, recommendations: any): Promise<void> {
    try {
      await this.updateStorageConfig(projectId, {
        compression: {
          enabled: recommendations.compressionLevel > 0,
          level: recommendations.compressionLevel
        },
        deduplication: {
          enabled: recommendations.dedupBlockSize > 0,
          blockSize: recommendations.dedupBlockSize
        },
        tiering: {
          policy: recommendations.tieringPolicy
        }
      });

      await this.metrics.recordOptimization('storage', projectId, recommendations);
    } catch (error) {
      logger.error('Failed to apply storage optimizations:', error);
      throw error;
    }
  }

  // Helper Methods
  private getTimeframeMultiplier(timeframe: string): number {
    switch (timeframe) {
      case '1h': return 1;
      case '24h': return 24;
      case '7d': return 168;
      default: return 1;
    }
  }

  private calculateDynamicLimit(baseValue: number, buffer: number): number {
    return Math.ceil(baseValue * buffer);
  }

  private determineCompressionLevel(predictedUsage: number): number {
    if (predictedUsage > 1000) return 9; // Maximum compression
    if (predictedUsage > 500) return 6; // Medium compression
    return 3; // Light compression
  }

  private calculateOptimalDedupBlockSize(predictedUsage: number): number {
    if (predictedUsage > 1000) return 8192; // 8KB for large datasets
    if (predictedUsage > 500) return 16384; // 16KB for medium datasets
    return 4096; // 4KB for small datasets
  }

  private determineTieringPolicy(predictedUsage: number, growthRate: number): string {
    if (growthRate > 0.5) return 'aggressive';
    if (growthRate > 0.2) return 'balanced';
    return 'conservative';
  }

  private calculateSeasonalityFactor(seasonality: any): number {
    // Implement seasonality factor calculation based on historical patterns
    return 1 + (seasonality.amplitude || 0);
  }

  private async updateStorageConfig(projectId: string, config: any): Promise<void> {
    await prisma.projectConfig.update({
      where: { projectId },
      data: {
        optimizationConfig: {
          ...config,
          storage: config
        }
      }
    });
  }

  private async updateProjectConfig(projectId: string, recommendations: any): Promise<void> {
    await prisma.projectConfig.update({
      where: { projectId },
      data: {
        optimizationConfig: recommendations,
        lastOptimized: new Date()
      }
    });
  }

  private async calculateCurrentCosts(metrics: ResourceMetrics[]): Promise<any> {
    const cpuCost = this.calculateResourceCost(metrics.map(m => m.cpu.usage), 0.0001);
    const memoryCost = this.calculateResourceCost(metrics.map(m => m.memory.used), 0.00001);
    const storageCost = this.calculateResourceCost(metrics.map(m => m.storage.used), 0.000001);

    return {
      cpu: cpuCost,
      memory: memoryCost,
      storage: storageCost,
      total: cpuCost + memoryCost + storageCost
    };
  }

  private async calculateProjectedCosts(recommendations: any): Promise<any> {
    const cpuCost = this.calculateResourceCost([recommendations.cpu.limit], 0.0001);
    const memoryCost = this.calculateResourceCost([recommendations.memory.limit], 0.00001);
    const storageCost = this.calculateResourceCost([recommendations.storage.compressionLevel], 0.000001);

    return {
      cpu: cpuCost,
      memory: memoryCost,
      storage: storageCost,
      total: cpuCost + memoryCost + storageCost
    };
  }

  private calculateResourceCost(values: number[], ratePerUnit: number): number {
    const averageUsage = this.calculateAverage(values);
    return averageUsage * ratePerUnit * this.METRICS_WINDOW;
  }

  private detectAnomalies(metrics: ResourceMetrics[]): any {
    return {
      cpu: this.detectResourceAnomalies(
        metrics.map(m => m.cpu.usage),
        'cpu'
      ),
      memory: this.detectResourceAnomalies(
        metrics.map(m => m.memory.used),
        'memory'
      ),
      storage: this.detectResourceAnomalies(
        metrics.map(m => m.storage.used),
        'storage'
      ),
      network: this.detectResourceAnomalies(
        metrics.map(m => m.network.latency),
        'network'
      )
    };
  }

  private detectResourceAnomalies(values: number[], resourceType: string): any {
    const mean = this.calculateAverage(values);
    const stdDev = this.calculateStandardDeviation(values);
    const threshold = stdDev * 3; // 3 sigma rule for anomaly detection

    const anomalies = values.map((value, index) => ({
      value,
      timestamp: new Date(Date.now() - (values.length - index) * 60000),
      isAnomaly: Math.abs(value - mean) > threshold
    })).filter(item => item.isAnomaly);

    return {
      count: anomalies.length,
      anomalies,
      severity: this.calculateAnomalySeverity(anomalies.length, values.length),
      lastDetected: anomalies.length > 0 ? anomalies[anomalies.length - 1].timestamp : null
    };
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = this.calculateAverage(values);
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    return Math.sqrt(this.calculateAverage(squareDiffs));
  }

  private calculateAnomalySeverity(anomalyCount: number, totalSamples: number): 'low' | 'medium' | 'high' {
    const anomalyRatio = anomalyCount / totalSamples;
    if (anomalyRatio > 0.1) return 'high';
    if (anomalyRatio > 0.05) return 'medium';
    return 'low';
  }

  private analyzeTrends(metrics: ResourceMetrics[]): any {
    return {
      cpu: this.analyzeResourceTrend(
        metrics.map(m => ({ value: m.cpu.usage, timestamp: new Date() }))
      ),
      memory: this.analyzeResourceTrend(
        metrics.map(m => ({ value: m.memory.used, timestamp: new Date() }))
      ),
      storage: this.analyzeResourceTrend(
        metrics.map(m => ({ value: m.storage.used, timestamp: new Date() }))
      ),
      network: this.analyzeResourceTrend(
        metrics.map(m => ({ value: m.network.latency, timestamp: new Date() }))
      )
    };
  }

  private analyzeResourceTrend(data: Array<{ value: number; timestamp: Date }>): any {
    const values = data.map(d => d.value);
    const trend = this.calculateTrend(values);
    const volatility = this.calculateVolatility(values);
    const forecast = this.forecastNextValue(values);

    return {
      direction: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
      slope: trend,
      volatility,
      forecast,
      confidence: this.calculateTrendConfidence(volatility, values.length)
    };
  }

  private calculateVolatility(values: number[]): number {
    const diffs = values.slice(1).map((value, index) => 
      Math.abs(value - values[index]) / values[index]
    );
    return this.calculateAverage(diffs);
  }

  private forecastNextValue(values: number[]): number {
    const trend = this.calculateTrend(values);
    return values[values.length - 1] + trend;
  }

  private calculateTrendConfidence(volatility: number, sampleSize: number): number {
    // Higher confidence with lower volatility and larger sample size
    const volatilityFactor = Math.max(0, 1 - volatility);
    const sizeFactor = Math.min(1, sampleSize / 100);
    return volatilityFactor * sizeFactor;
  }
}
