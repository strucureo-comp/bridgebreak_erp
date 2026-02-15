
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search');

        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                {
                    variants: {
                        some: {
                            sku: { contains: search, mode: 'insensitive' }
                        }
                    }
                }
            ];
        }

        const products = await prisma.product.findMany({
            where,
            include: {
                variants: {
                    include: {
                        inventory: true // Include stock levels
                    }
                },
                attributes: true
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(products);
    } catch (error) {
        console.error('GET /api/admin/scm/products ERROR:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, description, type, category, uom, sku, price, cost } = body;

        // Transaction to create Product and Default Variant
        const product = await prisma.$transaction(async (tx) => {
            const newProduct = await tx.product.create({
                data: {
                    name,
                    description,
                    type,
                    category,
                    uom,
                }
            });

            // Create default variant if SKU is provided (basic product)
            if (sku) {
                await tx.productVariant.create({
                    data: {
                        product_id: newProduct.id,
                        sku,
                        name: name, // Default variant name same as product
                        price: price || 0,
                        cost: cost || 0,
                    }
                });
            }

            return newProduct;
        });

        return NextResponse.json(product);
    } catch (error) {
        console.error('POST /api/admin/scm/products ERROR:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
