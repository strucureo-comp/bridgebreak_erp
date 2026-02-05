import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

interface FileUploadPayload {
  project_id: string;
  module_type: string;
  file_path: string;
  file_name: string;
  uploaded_by: string;
  file_size?: number;
  file_type?: 'document' | 'image' | 'other';
  mime_type?: string;
  visibility?: 'private' | 'internal';
  metadata?: Record<string, any>;
}

const getFileType = (fileName: string, mimeType?: string): 'document' | 'image' | 'other' => {
  if (mimeType?.startsWith('image/')) return 'image';
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (!ext) return 'other';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'image';
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(ext)) return 'document';
  return 'other';
};

/**
 * POST /api/projects/upload-files
 * Register file uploads and associate with project modules
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: FileUploadPayload = await req.json();

    // Validate required fields
    if (!body.project_id || !body.module_type || !body.file_path || !body.file_name) {
      return NextResponse.json(
        { error: 'Missing required fields: project_id, module_type, file_path, file_name' },
        { status: 400 }
      );
    }

    const allowedModules = new Set([
      'core',
      'finance',
      'labour',
      'inventory',
      'design',
      'timeline',
      'resources',
      'expenses',
      'client',
    ]);

    if (!allowedModules.has(body.module_type)) {
      return NextResponse.json(
        { error: 'Invalid module_type' },
        { status: 400 }
      );
    }

    const normalizedPath = body.file_path.replace(/\/+$/, '');
    const fileUrl = `${normalizedPath}/${body.file_name}`;
    const resolvedType = body.file_type || getFileType(body.file_name, body.mime_type);
    const sizeValue = Math.max(0, Number(body.file_size || 0));

    const fileRecord = await prisma.projectFile.create({
      data: {
        project_id: body.project_id,
        file_name: body.file_name,
        file_url: fileUrl,
        file_type: resolvedType,
        file_size: BigInt(sizeValue),
        uploaded_by: body.uploaded_by || session.user.id,
      },
    });

    // Trigger module integration if applicable
    const integrations = {
      finance: '/api/finance/general-ledger',
      labour: `/api/projects/${body.project_id}/team`,
      inventory: '/api/inventory/items',
      design: `/api/projects/${body.project_id}/financials`,
    };

    const integrationUrl = integrations[body.module_type as keyof typeof integrations];

    return NextResponse.json(
      {
        success: true,
        message: 'File uploaded and registered successfully',
        file: {
          ...fileRecord,
          file_size: fileRecord.file_size.toString(),
          module_type: body.module_type,
          visibility: body.visibility || 'private',
        },
        integration: {
          module: body.module_type,
          endpoint: integrationUrl,
          status: 'ready',
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process file upload' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/projects/upload-files
 * List uploaded files for a project
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const projectId = searchParams.get('project_id');
    const moduleType = searchParams.get('module_type');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing project_id parameter' },
        { status: 400 }
      );
    }

    const files = await prisma.projectFile.findMany({
      where: {
        project_id: projectId,
      },
      orderBy: { created_at: 'desc' },
    });

    const filteredFiles = moduleType
      ? files.filter((file) => file.file_url.includes(`/${moduleType}/`))
      : files;

    return NextResponse.json(
      {
        success: true,
        count: filteredFiles.length,
        files: filteredFiles.map((file) => ({
          ...file,
          file_size: file.file_size.toString(),
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('File retrieval error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve files' },
      { status: 500 }
    );
  }
}
