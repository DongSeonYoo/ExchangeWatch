import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

export const ApiOffsetResponse = <T extends Type<any>>(itemSchema: T) => {
  return applyDecorators(
    ApiExtraModels(itemSchema),
    ApiOkResponse({
      schema: {
        properties: {
          statusCode: {
            type: 'number',
            description: 'HTTP 상태 코드',
            example: 200,
          },
          message: {
            type: 'string',
            description: '응답 메시지',
          },
          requestURL: {
            type: 'string',
            description: '요청 URL',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: '응답 시간',
            example: new Date().toISOString(),
          },
          data: {
            properties: {
              items: {
                type: 'array',
                items: {
                  $ref: getSchemaPath(itemSchema),
                },
              },
              meta: {
                properties: {
                  totalItems: {
                    type: 'number',
                    description: '전체 아이템 수',
                  },
                  totalPages: {
                    type: 'number',
                    description: '전체 페이지 수',
                  },
                },
              },
            },
          },
        },
      },
    }),
  );
};
