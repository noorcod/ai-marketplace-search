import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { QuickLinksRepository } from '@modules/quick-links/repositories/quick-links.repository';
import { AppResponse } from '@common/responses/app-response';
import { QueryOptions, QueryWhere } from '@common/interfaces/repository.interface';
import { QuickLink } from '@modules/quick-links/entities/quick-link.entity';
import { QuickLinkFilter } from '@modules/quick-links/entities/quick-link-filter.entity';
import { QuickLinksGroupedCategoryDto } from '@modules/quick-links/dtos/quick-links-response.dto';

@Injectable()
export class QuickLinksService {
  private readonly logger = new Logger(QuickLinksService.name);

  constructor(private readonly quickLinksRepository: QuickLinksRepository) {}

  private parseFaqs(faqs?: string): any[] {
    if (!faqs) return [];
    try {
      const parsed = JSON.parse(faqs);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async fetchAllQuickLinksGroupedByCategory(): Promise<AppResponse<Record<string, QuickLinksGroupedCategoryDto>>> {
    try {
      const where: QueryWhere<QuickLink> = {
        isDeleted: 0 as any,
        isActive: 1 as any,
      };

      const options: QueryOptions<QuickLink> = {
        fields: ['slug', 'linkText', 'categoryName'] as any,
        orderBy: { categoryName: 'ASC', id: 'ASC' } as any,
      };

      const categoryResult = await this.quickLinksRepository.fetch(where, options);
      if (!categoryResult.success) {
        return AppResponse.Err(categoryResult.message as any);
      }

      const data = (categoryResult.data as QuickLink[]) ?? [];
      const response: Record<string, QuickLinksGroupedCategoryDto> = {};

      data.forEach(item => {
        const categoryName = ((item.categoryName ?? '').toString() || 'Uncategorized').trim();
        const slug = (item.slug ?? '').toString();
        const linkText = (item.linkText ?? '').toString();

        if (!slug) return;

        if (!response[categoryName]) {
          response[categoryName] = { links: [] };
        }

        response[categoryName].links.push({ slug, link_text: linkText });
      });

      return AppResponse.Ok<Record<string, QuickLinksGroupedCategoryDto>>(response);
    } catch (error) {
      this.logger.error(`fetchAllQuickLinksGroupedByCategory error: ${error.message}`, (error as any)?.stack);
      return AppResponse.Err(`Error fetching grouped quick-links: ${error.message}`);
    }
  }

  async fetchQuickLinkDetailBySlug(slug: string) {
    try {
      const normalizedSlug = (slug ?? '').trim();
      if (!normalizedSlug) {
        return AppResponse.Err('Slug is required');
      }

      const where: QueryWhere<QuickLink> = {
        slug: normalizedSlug,
        isDeleted: 0 as any,
      };

      const options: QueryOptions<QuickLink> = {
        populate: ['filters'],
        populateWhere: {
          filters: { isDeleted: 0 as any },
        },
      };

      const result = await this.quickLinksRepository.fetchOne(where, options);
      if (!result.success || !result.data) {
        return AppResponse.Err(`No quick-links found for slug: ${normalizedSlug}`, HttpStatus.NOT_FOUND);
      }

      const quickLink = result.data as QuickLink;
      const {
        id,
        slug: dbSlug,
        title,
        linkText,
        category,
        categoryName,
        metaTitle,
        metaDescription,
        metaKeyword,
        content,
      } = quickLink;

      const rawFilters: QuickLinkFilter[] = quickLink.filters?.getItems?.() ?? [];
      const filters: Array<{ id: number | null; key: string | null; name: string; value: string }> = [];
      const seen = new Set<string>();

      for (const f of rawFilters) {
        const uniqueKey = `${f.id ?? 'null'}:${f.filterKey ?? ''}`;
        if (seen.has(uniqueKey)) continue;
        seen.add(uniqueKey);

        filters.push({
          id: f.id ?? null,
          key: f.filterKey ?? null,
          name: f.filterName ?? '',
          value: f.filterValues ?? '',
        });
      }

      const response = {
        id: id ?? null,
        slug: dbSlug ?? normalizedSlug,
        title: title ?? '',
        linkText: linkText ?? '',
        categoryId: category ?? null,
        categoryName: categoryName ?? null,
        metaTitle: metaTitle ?? '',
        metaDescription: metaDescription ?? '',
        metaKeyword: metaKeyword ?? '',
        content: content ?? '',
        faqs: this.parseFaqs(quickLink.faqs),
        isActive: Boolean(quickLink.isActive),
        isCore: Boolean(quickLink.isCore),
        filters,
      };

      return AppResponse.Ok(response);
    } catch (error) {
      this.logger.error(`fetchQuickLinkDetailBySlug error: ${error.message}`, (error as any)?.stack);
      return AppResponse.Err(`Error fetching quick-links by slug: ${error.message}`);
    }
  }
}
