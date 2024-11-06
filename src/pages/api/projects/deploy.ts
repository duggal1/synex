import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/prisma/index';
import { DeploymentService } from '@/services/deployment';

const deploymentService = new DeploymentService();

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = await parseMultipartForm(req);
    const { projectId } = form.fields;
    const projectFiles = form.files.project;

    // Create deployment record
    const deployment = await prisma.deployment.create({
      data: {
        projectId,
        status: 'BUILDING',
        version: '1.0.0',
        buildLogs: [],
      },
    });

    // Start deployment process
    const result = await deploymentService.deployProject(
      projectId,
      projectFiles.buffer
    );

    // Update deployment status
    await prisma.deployment.update({
      where: { id: deployment.id },
      data: { status: 'DEPLOYED' },
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
} 