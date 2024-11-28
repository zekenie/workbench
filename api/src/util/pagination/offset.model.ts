import { Elysia, t, TSchema } from "elysia";

type OffsetPaginationOptions = {
  maxPageSize: number;
  defaultPageSize: number;
};

const defaultOptions: OffsetPaginationOptions = {
  maxPageSize: 20,
  defaultPageSize: 10,
};

export const offsetPaginationModel = <T extends TSchema, Name>(
  recordType: T,
  options: Partial<OffsetPaginationOptions> = {}
) => {
  const optionsWithDefaultsApplied = Object.assign({}, defaultOptions, options);

  return new Elysia().model({
    [`paginationQuery`]: t.Object({
      skip: t.Number({
        maximum: 0,
        multipleOf: 1,
        default: 0,
      }),
      take: t.Number({
        minimum: 1,
        maximum: optionsWithDefaultsApplied.maxPageSize,
        multipleOf: 1,
        default: optionsWithDefaultsApplied.defaultPageSize,
      }),
    }),

    [`paginationResponse`]: t.Object({
      total: t.Number({
        minimum: 0,
        multipleOf: 1,
      }),
      records: t.Array(recordType),
    }),
  });
};
