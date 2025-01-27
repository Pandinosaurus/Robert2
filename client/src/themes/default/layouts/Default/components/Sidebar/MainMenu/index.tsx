import './index.scss';
import { defineComponent } from '@vue/composition-api';
import { BookingsViewMode } from '@/stores/api/users';
import { Group } from '@/stores/api/groups';
import Item from './Item';

import type { Session } from '@/stores/api/session';
import type { MenuLinkItem } from './Item';

/** Menu principal de la barre latérale du layout par défaut. */
const DefaultLayoutSidebarMainMenu = defineComponent({
    name: 'DefaultLayoutSidebarMainMenu',
    computed: {
        links(): MenuLinkItem[] {
            const links: MenuLinkItem[] = [];

            const { default_bookings_view: defaultBookingsView } = this.$store.state.auth.user as Session;
            if (defaultBookingsView === BookingsViewMode.LISTING) {
                links.push({ ident: 'schedule-listing', to: '/schedule/listing', icon: 'list' });
            } else {
                links.push({ ident: 'schedule-calendar', to: '/schedule/calendar', icon: 'calendar-alt' });
            }

            const isAdmin = this.$store.getters['auth/is'](Group.ADMINISTRATION);
            const isMember = this.$store.getters['auth/is'](Group.MANAGEMENT);
            if (isAdmin || isMember) {
                links.push(
                    { ident: 'materials', to: '/materials', icon: 'box' },
                    { ident: 'technicians', to: '/technicians', icon: 'people-carry' },
                    { ident: 'beneficiaries', to: '/beneficiaries', icon: 'address-book' },
                );
            }

            if (isAdmin) {
                links.push(
                    { ident: 'parks', to: '/parks', icon: 'industry' },
                    { ident: 'users', to: '/users', icon: 'users-cog' },
                );
            }

            return links;
        },
    },
    render() {
        const { links } = this;

        return (
            <ul class="DefaultLayoutSidebarMainMenu">
                {links.map(({ ident, icon, to, counter, exact }: MenuLinkItem) => (
                    <Item
                        key={ident}
                        ident={ident}
                        to={to}
                        icon={icon}
                        counter={counter}
                        exact={exact}
                    />
                ))}
            </ul>
        );
    },
});

export default DefaultLayoutSidebarMainMenu;
