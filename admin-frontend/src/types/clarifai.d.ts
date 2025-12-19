declare module 'clarifai' {
  export interface Concept {
    id: string;
    name: string;
    app_id: string;
    value: number;
    created_at: string;
  }

  export interface ModelOutput {
    id: string;
    status: {
      code: number;
      description: string;
    };
    created_at: string;
    model: {
      id: string;
      name: string;
      created_at: string;
      app_id: string;
      output_info: {
        message: string;
        type: string;
        type_ext: string;
      };
    };
    inputs: any[];
    data: {
      concepts: Concept[];
    };
  }

  export interface ModelResponse {
    status: {
      code: number;
      description: string;
    };
    outputs: ModelOutput[];
  }

  export class App {
    constructor(options: { apiKey: string });
    models: {
      predict(modelId: string, inputs: string | { url: string }): Promise<ModelResponse>;
    };
  }

  export const GENERAL_MODEL: string;
}
