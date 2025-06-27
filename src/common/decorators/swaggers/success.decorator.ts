import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

export const ApiSuccess = (schema: Type<any> | Record<string, any>) => {
  const isClass = (obj: any): obj is Type<any> => {
    return typeof obj === 'function';
  };

  /**
   * convert literal object to openAPI spec
   */
  const convertToOpenAPISchema = (obj: Record<string, any>) => {
    const properties: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      properties[key] = {
        type: typeof value,
        example: value,
      };
    }

    return properties;
  };

  const decorators = [
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
          data: isClass(schema)
            ? { $ref: getSchemaPath(schema) }
            : { type: 'object', properties: convertToOpenAPISchema(schema) },
        },
      },
    }),
  ];

  if (isClass(schema)) {
    decorators.unshift(ApiExtraModels(schema));
  }

  return applyDecorators(...decorators);
};
