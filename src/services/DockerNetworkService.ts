export class DockerNetworkService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any;
  async setupNetworks() {
    const networks = [
      {
        Name: 'edge-network',
        Driver: 'overlay',
        Attachable: true,
        IPAMConfig: {
          Subnet: '172.20.0.0/16',
          IPRange: '172.20.10.0/24'
        }
      },
      {
        Name: 'database-network',
        Driver: 'overlay',
        Attachable: true,
        IPAMConfig: {
          Subnet: '172.21.0.0/16',
          IPRange: '172.21.10.0/24'
        }
      },
      {
        Name: 'monitoring-network',
        Driver: 'overlay',
        Attachable: true,
        IPAMConfig: {
          Subnet: '172.22.0.0/16',
          IPRange: '172.22.10.0/24'
        }
      }
    ];

    await Promise.all(
      networks.map(network =>
        this.docker.createNetwork(network)
      )
    );
  }
} 