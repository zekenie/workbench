export default {
  items: [
    {
      path: "",
      type: "object",
      preview: {
        type: "object",
        constructor: "Object",
        size: 3,
        keyPreviews: [
          {
            key: "auth_config",
            value: "Object {...}",
            type: "object",
          },
          {
            key: "maintenance_mode",
            value: "false",
            type: "boolean",
          },
          {
            key: "interested_in",
            value: "Array(3)",
            type: "array",
          },
        ],
        hasMore: false,
      },
    },
    {
      path: "auth_config",
      type: "object",
      preview: {
        type: "object",
        constructor: "Object",
        size: 7,
        keyPreviews: [
          {
            key: "object",
            value: '"auth_config"',
            type: "string",
          },
          {
            key: "id",
            value: '"aac_2mvmyP9dVn67vHkq..."',
            type: "string",
          },
          {
            key: "first_name",
            value: '"required"',
            type: "string",
          },
        ],
        hasMore: true,
      },
    },
    {
      path: "maintenance_mode",
      type: "boolean",
      preview: false,
    },
    {
      path: "interested_in",
      type: "array",
      preview: {
        type: "object",
        constructor: "Array",
        size: 3,
        keyPreviews: [
          {
            key: "0",
            value: "Object {...}",
            type: "object",
          },
          {
            key: "1",
            value: "Object {...}",
            type: "object",
          },
          {
            key: "2",
            value: "Object {...}",
            type: "object",
          },
        ],
        hasMore: false,
      },
    },
    {
      path: "auth_config.object",
      type: "string",
      preview: {
        type: "string",
        value: "auth_config",
        isTruncated: false,
        fullLength: 11,
      },
    },
    {
      path: "auth_config.id",
      type: "string",
      preview: {
        type: "string",
        value: "aac_2mvmyP9dVn67vHkq",
        isTruncated: true,
        fullLength: 31,
      },
    },
    {
      path: "auth_config.first_name",
      type: "string",
      preview: {
        type: "string",
        value: "required",
        isTruncated: false,
        fullLength: 8,
      },
    },
    {
      path: "auth_config.last_name",
      type: "string",
      preview: {
        type: "string",
        value: "required",
        isTruncated: false,
        fullLength: 8,
      },
    },
    {
      path: "auth_config.email_address",
      type: "string",
      preview: {
        type: "string",
        value: "on",
        isTruncated: false,
        fullLength: 2,
      },
    },
    {
      path: "auth_config.phone_number",
      type: "string",
      preview: {
        type: "string",
        value: "off",
        isTruncated: false,
        fullLength: 3,
      },
    },
    {
      path: "auth_config.username",
      type: "string",
      preview: {
        type: "string",
        value: "off",
        isTruncated: false,
        fullLength: 3,
      },
    },
    {
      path: "interested_in.0",
      type: "object",
      preview: {
        type: "object",
        constructor: "Object",
        size: 2,
        keyPreviews: [
          {
            key: "id",
            value: '"1234"',
            type: "string",
          },
          {
            key: "topic",
            value: '"cats"',
            type: "string",
          },
        ],
        hasMore: false,
      },
    },
    {
      path: "interested_in.1",
      type: "object",
      preview: {
        type: "object",
        constructor: "Object",
        size: 2,
        keyPreviews: [
          {
            key: "id",
            value: '"1235"',
            type: "string",
          },
          {
            key: "topic",
            value: '"tax law"',
            type: "string",
          },
        ],
        hasMore: false,
      },
    },
    {
      path: "interested_in.2",
      type: "object",
      preview: {
        type: "object",
        constructor: "Object",
        size: 2,
        keyPreviews: [
          {
            key: "id",
            value: '"1235"',
            type: "string",
          },
          {
            key: "topic",
            value: '"cat tax law"',
            type: "string",
          },
        ],
        hasMore: false,
      },
    },
    {
      path: "interested_in.0.id",
      type: "string",
      preview: {
        type: "string",
        value: "1234",
        isTruncated: false,
        fullLength: 4,
      },
    },
    {
      path: "interested_in.0.topic",
      type: "string",
      preview: {
        type: "string",
        value: "cats",
        isTruncated: false,
        fullLength: 4,
      },
    },
    {
      path: "interested_in.1.id",
      type: "string",
      preview: {
        type: "string",
        value: "1235",
        isTruncated: false,
        fullLength: 4,
      },
    },
    {
      path: "interested_in.1.topic",
      type: "string",
      preview: {
        type: "string",
        value: "tax law",
        isTruncated: false,
        fullLength: 7,
      },
    },
    {
      path: "interested_in.2.id",
      type: "string",
      preview: {
        type: "string",
        value: "1235",
        isTruncated: false,
        fullLength: 4,
      },
    },
    {
      path: "interested_in.2.topic",
      type: "string",
      preview: {
        type: "string",
        value: "cat tax law",
        isTruncated: false,
        fullLength: 11,
      },
    },
  ],
  nextToken: "interested_in.2.topic",
  hasNextPage: false,
};
