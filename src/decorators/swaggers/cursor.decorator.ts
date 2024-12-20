import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

export const ApiCursorResponse = <T extends Type<any>>(itemSchema: T) => {
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
                  nextCursor: {
                    type: 'number',
                    description: '다음 페이지 커서',
                  },
                  hasNextPage: {
                    type: 'number',
                    description: '다음 페이지 존재 여부',
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
