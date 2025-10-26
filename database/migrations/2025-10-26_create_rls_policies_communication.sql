-- =====================================================
-- RLS POLICIES - COMMUNICATION TABLES (Priority 3)
-- =====================================================
-- Purpose: Secure messaging, reviews, and notifications
-- Date: October 26, 2025
-- Tables: Communication-related tables
-- Note: Drops existing policies first, then recreates
-- Note: Checks table existence to avoid errors
-- =====================================================

-- =====================================================
-- 1. CONVERSATIONS (MESSAGING)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS conversations_select_participant ON conversations;
    DROP POLICY IF EXISTS conversations_insert_participant ON conversations;
    DROP POLICY IF EXISTS conversations_update_participant ON conversations;
    
    -- Users can see conversations they're part of
    CREATE POLICY conversations_select_participant ON conversations
      FOR SELECT USING (
        conversation_id IN (
          SELECT conversation_id FROM conversationparticipants 
          WHERE user_id = auth.uid()
        )
      );

    -- Users can create conversations
    CREATE POLICY conversations_insert_participant ON conversations
      FOR INSERT WITH CHECK (true);

    -- Participants can update conversations
    CREATE POLICY conversations_update_participant ON conversations
      FOR UPDATE USING (
        conversation_id IN (
          SELECT conversation_id FROM conversationparticipants 
          WHERE user_id = auth.uid()
        )
      );
      
    RAISE NOTICE 'RLS policies created for conversations';
  ELSE
    RAISE NOTICE 'Skipping conversations - table does not exist';
  END IF;
END $$;

-- =====================================================
-- 2. CONVERSATION PARTICIPANTS
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversationparticipants') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS participants_select_own ON conversationparticipants;
    DROP POLICY IF EXISTS participants_insert_own ON conversationparticipants;
    DROP POLICY IF EXISTS participants_update_own ON conversationparticipants;
    
    -- Users can see participants in their conversations
    CREATE POLICY participants_select_own ON conversationparticipants
      FOR SELECT USING (
        conversation_id IN (
          SELECT conversation_id FROM conversationparticipants 
          WHERE user_id = auth.uid()
        )
      );

    -- Users can add participants to conversations they're in
    CREATE POLICY participants_insert_own ON conversationparticipants
      FOR INSERT WITH CHECK (
        conversation_id IN (
          SELECT conversation_id FROM conversationparticipants 
          WHERE user_id = auth.uid()
        )
      );

    -- Users can update their own participant record
    CREATE POLICY participants_update_own ON conversationparticipants
      FOR UPDATE USING (user_id = auth.uid());
      
    RAISE NOTICE 'RLS policies created for conversationparticipants';
  ELSE
    RAISE NOTICE 'Skipping conversationparticipants - table does not exist';
  END IF;
END $$;

-- =====================================================
-- 3. MESSAGES
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS messages_select_participant ON messages;
    DROP POLICY IF EXISTS messages_insert_participant ON messages;
    DROP POLICY IF EXISTS messages_update_sender ON messages;
    
    -- Users can see messages in their conversations
    CREATE POLICY messages_select_participant ON messages
      FOR SELECT USING (
        conversation_id IN (
          SELECT conversation_id FROM conversationparticipants 
          WHERE user_id = auth.uid()
        )
      );

    -- Users can send messages to conversations they're in
    CREATE POLICY messages_insert_participant ON messages
      FOR INSERT WITH CHECK (
        sender_id = auth.uid()
        AND conversation_id IN (
          SELECT conversation_id FROM conversationparticipants 
          WHERE user_id = auth.uid()
        )
      );

    -- Users can update their own messages
    CREATE POLICY messages_update_sender ON messages
      FOR UPDATE USING (sender_id = auth.uid());
      
    RAISE NOTICE 'RLS policies created for messages';
  ELSE
    RAISE NOTICE 'Skipping messages - table does not exist';
  END IF;
END $$;

-- =====================================================
-- 4. MESSAGE READ RECEIPTS
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messagereadreceipts') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS receipts_select_participant ON messagereadreceipts;
    DROP POLICY IF EXISTS receipts_insert_own ON messagereadreceipts;
    
    -- Users can see read receipts in their conversations
    CREATE POLICY receipts_select_participant ON messagereadreceipts
      FOR SELECT USING (
        message_id IN (
          SELECT message_id FROM messages 
          WHERE conversation_id IN (
            SELECT conversation_id FROM conversationparticipants 
            WHERE user_id = auth.uid()
          )
        )
      );

    -- Users can mark messages as read
    CREATE POLICY receipts_insert_own ON messagereadreceipts
      FOR INSERT WITH CHECK (user_id = auth.uid());
      
    RAISE NOTICE 'RLS policies created for messagereadreceipts';
  ELSE
    RAISE NOTICE 'Skipping messagereadreceipts - table does not exist';
  END IF;
END $$;

-- =====================================================
-- 5. MESSAGE REACTIONS
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messagereactions') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS reactions_select_participant ON messagereactions;
    DROP POLICY IF EXISTS reactions_insert_own ON messagereactions;
    DROP POLICY IF EXISTS reactions_delete_own ON messagereactions;
    
    -- Users can see reactions in their conversations
    CREATE POLICY reactions_select_participant ON messagereactions
      FOR SELECT USING (
        message_id IN (
          SELECT message_id FROM messages 
          WHERE conversation_id IN (
            SELECT conversation_id FROM conversationparticipants 
            WHERE user_id = auth.uid()
          )
        )
      );

    -- Users can add reactions
    CREATE POLICY reactions_insert_own ON messagereactions
      FOR INSERT WITH CHECK (user_id = auth.uid());

    -- Users can remove their own reactions
    CREATE POLICY reactions_delete_own ON messagereactions
      FOR DELETE USING (user_id = auth.uid());
      
    RAISE NOTICE 'RLS policies created for messagereactions';
  ELSE
    RAISE NOTICE 'Skipping messagereactions - table does not exist';
  END IF;
END $$;

-- =====================================================
-- 6. REVIEWS
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS reviews_select_public ON reviews;
    DROP POLICY IF EXISTS reviews_insert_own ON reviews;
    DROP POLICY IF EXISTS reviews_update_own ON reviews;
    
    -- Reviews are public (for marketplace)
    CREATE POLICY reviews_select_public ON reviews
      FOR SELECT USING (true);

    -- Users can create reviews for their orders
    -- Note: Check if orders table has customer_id, consumer_id, or user_id
    CREATE POLICY reviews_insert_own ON reviews
      FOR INSERT WITH CHECK (
        order_id IN (
          SELECT order_id FROM orders 
          WHERE (customer_id = auth.uid() OR consumer_id = auth.uid())
          OR courier_id IN (
            SELECT courier_id FROM couriers WHERE user_id = auth.uid()
          )
          OR store_id IN (
            SELECT store_id FROM stores WHERE owner_user_id = auth.uid()
          )
        )
      );

    -- Users can update their own reviews
    CREATE POLICY reviews_update_own ON reviews
      FOR UPDATE USING (
        order_id IN (
          SELECT order_id FROM orders 
          WHERE (customer_id = auth.uid() OR consumer_id = auth.uid())
        )
      );
      
    RAISE NOTICE 'RLS policies created for reviews';
  ELSE
    RAISE NOTICE 'Skipping reviews - table does not exist';
  END IF;
END $$;

-- =====================================================
-- 7. NOTIFICATION PREFERENCES
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_preferences') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS notif_prefs_select_own ON notification_preferences;
    DROP POLICY IF EXISTS notif_prefs_insert_own ON notification_preferences;
    DROP POLICY IF EXISTS notif_prefs_update_own ON notification_preferences;
    
    -- Users can see their own preferences
    CREATE POLICY notif_prefs_select_own ON notification_preferences
      FOR SELECT USING (user_id = auth.uid());

    -- Users can create their own preferences
    CREATE POLICY notif_prefs_insert_own ON notification_preferences
      FOR INSERT WITH CHECK (user_id = auth.uid());

    -- Users can update their own preferences
    CREATE POLICY notif_prefs_update_own ON notification_preferences
      FOR UPDATE USING (user_id = auth.uid());
      
    RAISE NOTICE 'RLS policies created for notification_preferences';
  ELSE
    RAISE NOTICE 'Skipping notification_preferences - table does not exist';
  END IF;
END $$;

-- =====================================================
-- 8. REVIEW REQUEST SETTINGS
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviewrequestsettings') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS review_settings_select_own ON reviewrequestsettings;
    DROP POLICY IF EXISTS review_settings_insert_own ON reviewrequestsettings;
    DROP POLICY IF EXISTS review_settings_update_own ON reviewrequestsettings;
    
    -- Users can see their own settings
    CREATE POLICY review_settings_select_own ON reviewrequestsettings
      FOR SELECT USING (user_id = auth.uid());

    -- Users can create their own settings
    CREATE POLICY review_settings_insert_own ON reviewrequestsettings
      FOR INSERT WITH CHECK (user_id = auth.uid());

    -- Users can update their own settings
    CREATE POLICY review_settings_update_own ON reviewrequestsettings
      FOR UPDATE USING (user_id = auth.uid());
      
    RAISE NOTICE 'RLS policies created for reviewrequestsettings';
  ELSE
    RAISE NOTICE 'Skipping reviewrequestsettings - table does not exist';
  END IF;
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
  v_policy_count INTEGER;
  v_table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE tablename IN (
    'conversations',
    'conversationparticipants',
    'messages',
    'messagereadreceipts',
    'messagereactions',
    'reviews',
    'notification_preferences',
    'reviewrequestsettings'
  );
  
  SELECT COUNT(*) INTO v_table_count
  FROM information_schema.tables
  WHERE table_name IN (
    'conversations',
    'conversationparticipants',
    'messages',
    'messagereadreceipts',
    'messagereactions',
    'reviews',
    'notification_preferences',
    'reviewrequestsettings'
  );
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'RLS POLICIES CREATED - COMMUNICATION TABLES';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Tables found: %', v_table_count;
  RAISE NOTICE 'Policies created: %', v_policy_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Communication tables now protected (if they exist):';
  RAISE NOTICE '  ✅ conversations (messaging)';
  RAISE NOTICE '  ✅ conversationparticipants (who is in conversations)';
  RAISE NOTICE '  ✅ messages (chat messages)';
  RAISE NOTICE '  ✅ messagereadreceipts (read tracking)';
  RAISE NOTICE '  ✅ messagereactions (likes, emojis)';
  RAISE NOTICE '  ✅ reviews (public reviews)';
  RAISE NOTICE '  ✅ notification_preferences (user settings)';
  RAISE NOTICE '  ✅ reviewrequestsettings (review automation)';
  RAISE NOTICE '==============================================';
END $$;
