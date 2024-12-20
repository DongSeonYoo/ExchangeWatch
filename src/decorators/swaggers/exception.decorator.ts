import { HttpException, Type, applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiProperty,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ExamplesObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { IExceptionResponse } from 'src/interfaces/response.interface';

export interface ErrorResponseOption<T extends HttpException> {
  /**
   * 에러 예시의 제목
   */
  exampleTitle: string;

  /**
   * 에러 스키마
   */
  schema: Type<T>;
}

export class ExceptionResponse implements IExceptionResponse {
  /**
   * 응답 메시지
   */
  message: string;

  /**
   * 요청 URL
   */
  requestURL: string;

  /**
   * timestamp
   */
  timestamp: Date;

  /**
   * HTTP 상태 코드
   */
  statusCode: number;
}

export const ApiExceptions = <T extends HttpException>(
  ...errorResponses: ErrorResponseOption<T>[]
) => {
  const examplesMap = new Map<number, ExamplesObject>();

  errorResponses.forEach((err: ErrorResponseOption<T>) => {
    const errorInstance = new err.schema();
    const statusCode = errorInstance.getStatus();
    const errorResponse: IExceptionResponse = {
      message: errorInstance.message,
      requestURL: 'requestURL',
      statusCode: statusCode,
      timestamp: new Date(),
    };

    if (!examplesMap.has(statusCode)) {
      examplesMap.set(statusCode, {});
    }

    const currentExamples = examplesMap.get(statusCode);
    if (currentExamples) {
      examplesMap.set(statusCode, {
        ...currentExamples,
        [err.exampleTitle]: {
          value: errorResponse,
        },
      });
    }
  });

  return applyDecorators(
    ApiExtraModels(ExceptionResponse),
    ...Array.from(examplesMap.entries()).map(([statusCode, examples]) =>
      ApiResponse({
        status: statusCode,
        content: {
          'application/json': {
            schema: {
              $ref: getSchemaPath(ExceptionResponse),
            },
            examples: examples,
          },
        },
      }),
    ),
  );
};
