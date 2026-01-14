import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    try {
      // Configurar permisos públicos para ciertos endpoints
      const publicRole = await strapi
        .query('plugin::users-permissions.role')
        .findOne({ where: { type: 'public' } });

      if (publicRole) {
        // Endpoints que deben ser públicos
        const publicActions = [
          'api::home-page.home-page.find',
          'api::home-page.home-page.findOne',
          'api::product.product.find',
          'api::product.product.findOne',
          'api::order.order.create',
        ];

        // Obtener permisos actuales del rol público
        const permissions = await strapi
          .query('plugin::users-permissions.permission')
          .findMany({
            where: {
              role: {
                id: publicRole.id,
              },
            },
          });

        for (const action of publicActions) {
          // Verificar si el permiso ya existe
          const exists = permissions.some((p) => p.action === action);

          if (!exists) {
            // Crear nuevo permiso
            await strapi.query('plugin::users-permissions.permission').create({
              data: {
                action,
                role: publicRole.id,
                enabled: true,
              },
            });
          }
        }

        console.log('✔ Public API permissions configured');
      }
    } catch (err) {
      console.error('Error configuring permissions:', err);
    }
  },
};
