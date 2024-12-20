import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

export const ApiSuccess = <T>(schema: Type<T>) => {
  return applyDecorators(
    ApiExtraModels(schema),
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
            $ref: getSchemaPath(schema),
          },
        },
      },
    }),
  );
};
